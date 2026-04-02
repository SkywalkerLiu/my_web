document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('monteCarloTool')
    if (!root) {
        return
    }

    const defaults = {
        currentHolding: 0,
        monthlyInvestment: 1500,
        expectedAnnualReturn: 15,
        investmentYears: 30,
        crashDrawdown: 50,
        crashIntervalYears: 15,
        annualVolatility: 20,
        simulationCount: 5000
    }

    const elements = {
        form: document.getElementById('mcCalculatorForm'),
        runButton: document.getElementById('mcRunButton'),
        resetButton: document.getElementById('mcResetButton'),
        status: document.getElementById('mcStatus'),
        validationMessage: document.getElementById('mcValidationMessage'),
        advancedToggle: document.getElementById('mcAdvancedToggle'),
        advancedFields: document.getElementById('mcAdvancedFields'),
        medianValue: document.getElementById('mcMedianValue'),
        rangeValue: document.getElementById('mcRangeValue'),
        principalValue: document.getElementById('mcPrincipalValue'),
        lossValue: document.getElementById('mcLossValue'),
        summaryTag: document.getElementById('mcSummaryTag'),
        eventSummary: document.getElementById('mcEventSummary'),
        crashZero: document.getElementById('mcCrashZero'),
        crashOne: document.getElementById('mcCrashOne'),
        crashTwo: document.getElementById('mcCrashTwo'),
        crashThreePlus: document.getElementById('mcCrashThreePlus'),
        chartFallback: document.getElementById('mcChartFallback'),
        chartPanels: Array.from(root.querySelectorAll('.mc-chart-panel')),
        chartTabs: Array.from(root.querySelectorAll('.mc-chart-tab')),
        currentHolding: document.getElementById('currentHolding'),
        monthlyInvestment: document.getElementById('monthlyInvestment'),
        expectedAnnualReturn: document.getElementById('expectedAnnualReturn'),
        investmentYears: document.getElementById('investmentYears'),
        crashDrawdown: document.getElementById('crashDrawdown'),
        crashIntervalYears: document.getElementById('crashIntervalYears'),
        annualVolatility: document.getElementById('annualVolatility'),
        simulationCount: document.getElementById('simulationCount'),
        pathsCanvas: document.getElementById('mcPathsChart'),
        fanCanvas: document.getElementById('mcFanChart'),
        histCanvas: document.getElementById('mcHistChart')
    }

    const state = {
        activeChart: 'paths',
        chartLibraryReady: typeof window.Chart !== 'undefined',
        charts: {},
        latestResult: null,
        dirtyCharts: new Set(['paths', 'fan', 'hist']),
        currentRequestId: 0,
        worker: null
    }

    const monteCarloCore = window.MonteCarloCalculatorCore || null

    const chartPalette = {
        gold: '#b48748',
        goldSoft: 'rgba(180, 135, 72, 0.22)',
        goldLine: '#9a6d43',
        ink: '#1f2937',
        outerBand: 'rgba(99, 102, 241, 0.18)',
        outerLine: 'rgba(99, 102, 241, 0.55)',
        innerBand: 'rgba(16, 185, 129, 0.18)',
        innerLine: 'rgba(16, 185, 129, 0.6)',
        sample: 'rgba(180, 135, 72, 0.18)',
        median: '#8b5e34',
        red: '#dc2626',
        green: '#059669',
        grid: 'rgba(148, 163, 184, 0.16)'
    }

    if (elements.chartFallback) {
        elements.chartFallback.hidden = state.chartLibraryReady
    }

    const registerFieldReset = field => {
        field.addEventListener('input', () => {
            if (elements.validationMessage && !elements.validationMessage.hidden) {
                elements.validationMessage.hidden = true
            }

            if (elements.status.dataset.state === 'invalid') {
                setStatus('idle', '参数已更新，可以重新开始计算。')
            }
        })
    }

    Object.keys(defaults).forEach(key => {
        if (elements[key]) {
            registerFieldReset(elements[key])
        }
    })

    elements.advancedToggle?.addEventListener('click', () => {
        const expanded = elements.advancedToggle.getAttribute('aria-expanded') === 'true'
        elements.advancedToggle.setAttribute('aria-expanded', String(!expanded))
        elements.advancedFields.hidden = expanded
    })

    elements.chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            selectChart(tab.dataset.chart)
        })
    })

    elements.resetButton?.addEventListener('click', () => {
        Object.entries(defaults).forEach(([key, value]) => {
            if (elements[key]) {
                elements[key].value = String(value)
            }
        })

        if (elements.advancedFields && elements.advancedToggle) {
            elements.advancedFields.hidden = true
            elements.advancedToggle.setAttribute('aria-expanded', 'false')
        }

        stopWorker()
        resetResults()
        setStatus('idle', '已恢复默认参数，可以重新开始计算。')
        if (elements.validationMessage) {
            elements.validationMessage.hidden = true
            elements.validationMessage.textContent = ''
        }
    })

    elements.form?.addEventListener('submit', event => {
        event.preventDefault()
        runSimulation()
    })

    resetResults()
    setStatus('idle', '填写参数后即可开始计算。')
    selectChart('paths')

    function runSimulation() {
        const validation = readAndValidateConfig()

        if (!validation.ok) {
            setStatus('invalid', '校验失败，请检查参数。')
            showValidationMessage(validation.message)
            return
        }

        showValidationMessage('')
        stopWorker()

        if (shouldUseMainThreadFallback()) {
            runSimulationOnMainThread(validation.config, true)
            return
        }

        let worker
        try {
            worker = createWorker()
        } catch (error) {
            if (monteCarloCore) {
                runSimulationOnMainThread(validation.config, false)
                return
            }

            setStatus('error', '计算失败，浏览器暂时无法启动后台计算线程。')
            showValidationMessage(normalizeError(error))
            return
        }

        state.worker = worker
        state.currentRequestId += 1
        const requestId = state.currentRequestId

        worker.addEventListener('message', event => {
            const data = event.data || {}
            if (data.requestId !== requestId) {
                return
            }

            if (data.type === 'result') {
                stopWorker()
                handleResult(data.payload)
                return
            }

            if (data.type === 'error') {
                stopWorker()
                setStatus('error', '计算失败，请稍后再试。')
                showValidationMessage(data.message || '后台计算过程中发生未知错误。')
            }
        })

        worker.addEventListener('error', error => {
            stopWorker()
            if (monteCarloCore) {
                runSimulationOnMainThread(validation.config, false)
                return
            }

            setStatus('error', '计算失败，请稍后再试。')
            showValidationMessage(normalizeError(error))
        })

        elements.runButton.disabled = true
        setStatus('running', `计算中，正在模拟 ${formatInteger(validation.config.simulationCount)} 条路径，请稍候...`)

        worker.postMessage({
            type: 'run',
            requestId,
            payload: validation.config
        })
    }

    function handleResult(payload) {
        state.latestResult = payload
        state.dirtyCharts = new Set(['paths', 'fan', 'hist'])
        elements.runButton.disabled = false

        renderMetrics(payload.summary)
        renderCrashBreakdown(payload.crashBreakdown)
        renderSummary(payload.summary)

        setStatus(
            'complete',
            `计算完成，已运行 ${formatInteger(payload.summary.simulationCount)} 次模拟，投资期内至少 1 次极端事件的触发率约为 ${formatPercent(payload.summary.crashOccurrenceRate)}。`
        )

        if (state.chartLibraryReady) {
            renderActiveChart()
        } else if (elements.chartFallback) {
            elements.chartFallback.hidden = false
        }
    }

    function runSimulationOnMainThread(config, forcedByFileProtocol) {
        if (!monteCarloCore) {
            setStatus('error', '计算失败，当前环境缺少本地计算模块。')
            showValidationMessage('无法启动后台线程，同时本地兜底计算模块也未加载。')
            return
        }

        elements.runButton.disabled = true

        if (forcedByFileProtocol) {
            setStatus('running', '检测到你正在以本地文件方式预览页面，已自动切换为前台计算模式。')
        } else {
            setStatus('running', '后台线程不可用，已自动切换为前台计算模式。')
        }

        window.setTimeout(() => {
            try {
                const payload = monteCarloCore.runMonteCarlo(config)
                handleResult(payload)
            } catch (error) {
                elements.runButton.disabled = false
                setStatus('error', '计算失败，请检查参数或稍后再试。')
                showValidationMessage(normalizeError(error))
            }
        }, 30)
    }

    function renderMetrics(summary) {
        elements.medianValue.textContent = formatAmount(summary.medianFinalValue)
        elements.rangeValue.textContent = `${formatAmount(summary.percentile10Final)} - ${formatAmount(summary.percentile90Final)}`
        elements.principalValue.textContent = formatAmount(summary.totalPrincipal)
        elements.lossValue.textContent = formatPercent(summary.lossProbability)
    }

    function renderCrashBreakdown(breakdown) {
        elements.crashZero.textContent = formatPercent(breakdown.zeroCrashRate)
        elements.crashOne.textContent = formatPercent(breakdown.oneCrashRate)
        elements.crashTwo.textContent = formatPercent(breakdown.twoCrashRate)
        elements.crashThreePlus.textContent = formatPercent(breakdown.threePlusCrashRate)
    }

    function renderSummary(summary) {
        elements.summaryTag.textContent = `${formatInteger(summary.simulationCount)} 次模拟`
        elements.eventSummary.textContent =
            `平均每条路径触发 ${summary.averageCrashCount.toFixed(2)} 次极端事件，至少发生 1 次的比例约为 ${formatPercent(summary.crashOccurrenceRate)}。` +
            `终值均值约 ${formatAmount(summary.meanFinalValue)}，最好结果 ${formatAmount(summary.bestFinalValue)}，最差结果 ${formatAmount(summary.worstFinalValue)}。`
    }

    function resetResults() {
        state.latestResult = null
        state.dirtyCharts = new Set(['paths', 'fan', 'hist'])

        elements.medianValue.textContent = '--'
        elements.rangeValue.textContent = '--'
        elements.principalValue.textContent = '--'
        elements.lossValue.textContent = '--'
        elements.summaryTag.textContent = '等待计算'
        elements.eventSummary.textContent = '完成计算后，这里会展示极端事件触发频率、平均触发次数和事件分布。'
        elements.crashZero.textContent = '--'
        elements.crashOne.textContent = '--'
        elements.crashTwo.textContent = '--'
        elements.crashThreePlus.textContent = '--'
        elements.runButton.disabled = false

        destroyCharts()
        if (elements.chartFallback) {
            elements.chartFallback.hidden = state.chartLibraryReady
        }
    }

    function selectChart(chartKey) {
        state.activeChart = chartKey

        elements.chartTabs.forEach(tab => {
            const active = tab.dataset.chart === chartKey
            tab.classList.toggle('is-active', active)
            tab.setAttribute('aria-selected', String(active))
        })

        elements.chartPanels.forEach(panel => {
            const active = panel.dataset.panel === chartKey
            panel.classList.toggle('is-active', active)
            panel.hidden = !active
        })

        renderActiveChart()
    }

    function renderActiveChart() {
        if (!state.latestResult || !state.chartLibraryReady) {
            return
        }

        const chartKey = state.activeChart
        renderChart(chartKey, state.latestResult)
        const chart = state.charts[chartKey]
        if (chart) {
            chart.resize()
        }
    }

    function renderChart(chartKey, result) {
        if (!state.dirtyCharts.has(chartKey) && state.charts[chartKey]) {
            return
        }

        if (chartKey === 'paths') {
            state.charts.paths = upsertChart(elements.pathsCanvas, state.charts.paths, createPathsConfig(result))
        }

        if (chartKey === 'fan') {
            state.charts.fan = upsertChart(elements.fanCanvas, state.charts.fan, createFanConfig(result))
        }

        if (chartKey === 'hist') {
            state.charts.hist = upsertChart(elements.histCanvas, state.charts.hist, createHistConfig(result))
        }

        state.dirtyCharts.delete(chartKey)
    }

    function upsertChart(canvas, existingChart, config) {
        if (!canvas || !window.Chart) {
            return null
        }

        if (existingChart) {
            existingChart.destroy()
        }

        return new window.Chart(canvas, config)
    }

    function createPathsConfig(result) {
        const datasets = result.sampledPaths.slice(0, 24).map((path, index) => ({
            label: `样本路径 ${index + 1}`,
            data: toPoints(result.monthAxisYears, path),
            borderColor: chartPalette.sample,
            borderWidth: 1,
            pointRadius: 0,
            tension: 0.18
        }))

        datasets.push({
            label: '中位数路径',
            data: toPoints(result.monthAxisYears, result.percentiles.p50),
            borderColor: chartPalette.median,
            borderWidth: 2.6,
            pointRadius: 0,
            tension: 0.18
        })

        return {
            type: 'line',
            data: { datasets },
            options: buildCartesianOptions({
                amountAxis: 'y',
                plugins: {
                    tooltip: {
                        filter: context => context.dataset.label === '中位数路径',
                        callbacks: {
                            title: items => `第 ${formatYear(items[0].parsed.x)} 年`,
                            label: context => `中位数路径：${formatAmount(context.parsed.y)}`
                        }
                    }
                }
            })
        }
    }

    function createFanConfig(result) {
        return {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'P10',
                        data: toPoints(result.monthAxisYears, result.percentiles.p10),
                        borderColor: chartPalette.outerLine,
                        borderWidth: 1,
                        pointRadius: 0,
                        tension: 0.12
                    },
                    {
                        label: 'P90',
                        data: toPoints(result.monthAxisYears, result.percentiles.p90),
                        borderColor: chartPalette.outerLine,
                        backgroundColor: chartPalette.outerBand,
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: '-1',
                        tension: 0.12
                    },
                    {
                        label: 'P25',
                        data: toPoints(result.monthAxisYears, result.percentiles.p25),
                        borderColor: chartPalette.innerLine,
                        borderWidth: 1,
                        pointRadius: 0,
                        tension: 0.12
                    },
                    {
                        label: 'P75',
                        data: toPoints(result.monthAxisYears, result.percentiles.p75),
                        borderColor: chartPalette.innerLine,
                        backgroundColor: chartPalette.innerBand,
                        borderWidth: 1,
                        pointRadius: 0,
                        fill: '-1',
                        tension: 0.12
                    },
                    {
                        label: 'P50',
                        data: toPoints(result.monthAxisYears, result.percentiles.p50),
                        borderColor: chartPalette.gold,
                        borderWidth: 2.6,
                        pointRadius: 0,
                        tension: 0.12
                    }
                ]
            },
            options: buildCartesianOptions({
                amountAxis: 'y',
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: items => `第 ${formatYear(items[0].parsed.x)} 年`,
                            label: context => `${context.dataset.label}：${formatAmount(context.parsed.y)}`
                        }
                    }
                }
            })
        }
    }

    function createHistConfig(result) {
        return {
            type: 'bar',
            data: {
                labels: result.histogram.bins.map(bin => `${formatCompactAmount(bin.start)} - ${formatCompactAmount(bin.end)}`),
                datasets: [
                    {
                        label: '出现次数',
                        data: result.histogram.bins.map(bin => bin.count),
                        backgroundColor: chartPalette.goldSoft,
                        borderColor: chartPalette.goldLine,
                        borderWidth: 1.4,
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: items => {
                                const bin = result.histogram.bins[items[0].dataIndex]
                                return `终值区间：${formatAmount(bin.start)} - ${formatAmount(bin.end)}`
                            },
                            label: context => `出现次数：${formatInteger(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: chartPalette.ink,
                            autoSkip: true,
                            maxTicksLimit: 6
                        },
                        grid: {
                            color: chartPalette.grid
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: chartPalette.ink,
                            callback: value => formatInteger(value)
                        },
                        grid: {
                            color: chartPalette.grid
                        }
                    }
                }
            }
        }
    }

    function buildCartesianOptions({ amountAxis, plugins }) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            parsing: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: false
                },
                ...plugins
            },
            scales: {
                x: {
                    type: 'linear',
                    min: 0,
                    ticks: {
                        color: chartPalette.ink,
                        callback: value => formatYear(value)
                    },
                    grid: {
                        color: chartPalette.grid
                    },
                    title: {
                        display: true,
                        text: '投资年份'
                    }
                },
                [amountAxis]: {
                    ticks: {
                        color: chartPalette.ink,
                        callback: value => formatCompactAmount(value)
                    },
                    grid: {
                        color: chartPalette.grid
                    },
                    title: {
                        display: true,
                        text: '资产规模'
                    }
                }
            }
        }
    }

    function readAndValidateConfig() {
        const rawValues = {
            currentHolding: readNumber(elements.currentHolding),
            monthlyInvestment: readNumber(elements.monthlyInvestment),
            expectedAnnualReturn: readNumber(elements.expectedAnnualReturn),
            investmentYears: readNumber(elements.investmentYears),
            crashDrawdown: readNumber(elements.crashDrawdown),
            crashIntervalYears: readNumber(elements.crashIntervalYears),
            annualVolatility: readNumber(elements.annualVolatility),
            simulationCount: readNumber(elements.simulationCount)
        }

        const finiteCheck = Object.entries(rawValues).find(([, value]) => !Number.isFinite(value))
        if (finiteCheck) {
            return {
                ok: false,
                message: '请把所有参数填写为有效数字。'
            }
        }

        if (rawValues.currentHolding < 0) {
            return { ok: false, message: '当前持有金额不能为负数。' }
        }

        if (rawValues.monthlyInvestment < 0) {
            return { ok: false, message: '每月定投金额不能为负数。' }
        }

        if (rawValues.expectedAnnualReturn <= -100) {
            return { ok: false, message: '预期年化收益率必须大于 -100%。' }
        }

        if (!Number.isInteger(rawValues.investmentYears) || rawValues.investmentYears < 1 || rawValues.investmentYears > 50) {
            return { ok: false, message: '投资年限必须是 1 到 50 年之间的整数。' }
        }

        if (rawValues.crashDrawdown < 0 || rawValues.crashDrawdown > 100) {
            return { ok: false, message: '极端回撤幅度必须在 0% 到 100% 之间。' }
        }

        if (rawValues.crashIntervalYears < 0.5 || rawValues.crashIntervalYears > 200) {
            return { ok: false, message: '极端事件间隔必须在 0.5 到 200 年之间。' }
        }

        if (rawValues.annualVolatility < 0 || rawValues.annualVolatility > 100) {
            return { ok: false, message: '年化波动率必须在 0% 到 100% 之间。' }
        }

        if (
            !Number.isInteger(rawValues.simulationCount) ||
            rawValues.simulationCount < 1000 ||
            rawValues.simulationCount > 10000 ||
            rawValues.simulationCount % 1000 !== 0
        ) {
            return { ok: false, message: '模拟次数必须在 1000 到 10000 之间，并且以 1000 为步进。' }
        }

        return {
            ok: true,
            config: {
                currentHolding: rawValues.currentHolding,
                monthlyInvestment: rawValues.monthlyInvestment,
                expectedAnnualReturn: rawValues.expectedAnnualReturn / 100,
                investmentYears: rawValues.investmentYears,
                crashDrawdown: rawValues.crashDrawdown / 100,
                crashIntervalYears: rawValues.crashIntervalYears,
                annualVolatility: rawValues.annualVolatility / 100,
                simulationCount: rawValues.simulationCount
            }
        }
    }

    function destroyCharts() {
        Object.values(state.charts).forEach(chart => {
            if (chart) {
                chart.destroy()
            }
        })

        state.charts = {}
    }

    function stopWorker() {
        if (state.worker) {
            state.worker.terminate()
            state.worker = null
        }

        if (elements.runButton) {
            elements.runButton.disabled = false
        }
    }

    function createWorker() {
        const workerUrl = new URL('tools-monte-carlo-worker.js', window.location.href)
        return new Worker(workerUrl)
    }

    function shouldUseMainThreadFallback() {
        return window.location.protocol === 'file:' && Boolean(monteCarloCore)
    }

    function showValidationMessage(message) {
        if (!elements.validationMessage) {
            return
        }

        elements.validationMessage.textContent = message
        elements.validationMessage.hidden = !message
    }

    function setStatus(stateName, message) {
        if (!elements.status) {
            return
        }

        elements.status.dataset.state = stateName
        elements.status.textContent = message
    }

    function readNumber(input) {
        return Number(input?.value ?? NaN)
    }

    function formatAmount(value) {
        const absolute = Math.abs(value)
        const digits = absolute >= 100 ? 0 : absolute >= 1 ? 2 : 3
        return new Intl.NumberFormat('zh-CN', {
            maximumFractionDigits: digits,
            minimumFractionDigits: 0
        }).format(value)
    }

    function formatCompactAmount(value) {
        const absolute = Math.abs(Number(value))
        if (absolute >= 100000000) {
            return `${trimTrailingZeros(value / 100000000)}亿`
        }
        if (absolute >= 10000) {
            return `${trimTrailingZeros(value / 10000)}万`
        }
        if (absolute >= 1000) {
            return `${trimTrailingZeros(value / 1000)}千`
        }
        return formatAmount(value)
    }

    function formatPercent(value) {
        return `${(value * 100).toFixed(1)}%`
    }

    function formatInteger(value) {
        return new Intl.NumberFormat('zh-CN', {
            maximumFractionDigits: 0
        }).format(Number(value))
    }

    function formatYear(value) {
        const rounded = Math.round(Number(value) * 10) / 10
        if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
            return `${Math.round(rounded)}`
        }
        return rounded.toFixed(1)
    }

    function trimTrailingZeros(value) {
        return Number(value.toFixed(1)).toString()
    }

    function toPoints(xValues, yValues) {
        return xValues.map((x, index) => ({
            x,
            y: yValues[index]
        }))
    }

    function normalizeError(error) {
        if (monteCarloCore && typeof monteCarloCore.normalizeError === 'function') {
            return monteCarloCore.normalizeError(error)
        }

        if (error && typeof error.message === 'string' && error.message.trim()) {
            return error.message.trim()
        }

        return '发生未知错误，请稍后再试。'
    }
})
