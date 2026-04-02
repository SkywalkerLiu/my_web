(function attachMonteCarloCore(globalScope) {
    function runMonteCarlo(config) {
        validateConfig(config)

        const simulationCount = config.simulationCount
        const months = config.investmentYears * 12
        const totalSteps = months + 1
        const totalPrincipal = config.currentHolding + config.monthlyInvestment * months

        const values = new Float64Array(simulationCount * totalSteps)
        const terminalValues = new Float64Array(simulationCount)
        const crashCounts = new Uint16Array(simulationCount)

        const monthlyTargetGross = Math.pow(1 + config.expectedAnnualReturn, 1 / 12)
        const sigmaMonthly = config.annualVolatility / Math.sqrt(12)
        const muMonthly = Math.log(monthlyTargetGross) - 0.5 * sigmaMonthly * sigmaMonthly
        const monthlyCrashProbability = 1 - Math.exp(-1 / (12 * config.crashIntervalYears))

        let totalTerminal = 0
        let lossCount = 0
        let crashOccurrenceCount = 0
        let crashCountSum = 0

        for (let simulationIndex = 0; simulationIndex < simulationCount; simulationIndex += 1) {
            const offset = simulationIndex * totalSteps
            let currentValue = config.currentHolding
            let crashCount = 0
            values[offset] = currentValue

            for (let monthIndex = 0; monthIndex < months; monthIndex += 1) {
                const logReturn = muMonthly + sigmaMonthly * randomNormal()
                let nextValue = currentValue * Math.exp(logReturn)

                if (Math.random() < monthlyCrashProbability) {
                    nextValue *= 1 - config.crashDrawdown
                    crashCount += 1
                }

                nextValue += config.monthlyInvestment
                currentValue = nextValue
                values[offset + monthIndex + 1] = currentValue
            }

            terminalValues[simulationIndex] = currentValue
            crashCounts[simulationIndex] = crashCount

            totalTerminal += currentValue
            crashCountSum += crashCount

            if (currentValue < totalPrincipal) {
                lossCount += 1
            }

            if (crashCount > 0) {
                crashOccurrenceCount += 1
            }
        }

        const percentiles = computePercentiles(values, simulationCount, totalSteps)
        const sortedTerminalValues = Float64Array.from(terminalValues)
        sortedTerminalValues.sort()

        const histogram = buildHistogram(sortedTerminalValues)
        const sampledPaths = samplePaths(values, simulationCount, totalSteps)
        const crashBreakdown = buildCrashBreakdown(crashCounts)

        return {
            monthAxisYears: Array.from({ length: totalSteps }, (_, index) => index / 12),
            percentiles,
            sampledPaths,
            histogram,
            crashBreakdown,
            summary: {
                simulationCount,
                totalPrincipal,
                medianFinalValue: percentileFromSorted(sortedTerminalValues, 0.5),
                meanFinalValue: totalTerminal / simulationCount,
                percentile10Final: percentileFromSorted(sortedTerminalValues, 0.1),
                percentile90Final: percentileFromSorted(sortedTerminalValues, 0.9),
                worstFinalValue: sortedTerminalValues[0],
                bestFinalValue: sortedTerminalValues[sortedTerminalValues.length - 1],
                lossProbability: lossCount / simulationCount,
                crashOccurrenceRate: crashOccurrenceCount / simulationCount,
                averageCrashCount: crashCountSum / simulationCount,
                zeroCrashRate: crashBreakdown.zeroCrashRate,
                oneCrashRate: crashBreakdown.oneCrashRate,
                twoCrashRate: crashBreakdown.twoCrashRate,
                threePlusCrashRate: crashBreakdown.threePlusCrashRate
            }
        }
    }

    function computePercentiles(values, simulationCount, totalSteps) {
        const p10 = new Array(totalSteps)
        const p25 = new Array(totalSteps)
        const p50 = new Array(totalSteps)
        const p75 = new Array(totalSteps)
        const p90 = new Array(totalSteps)
        const column = new Float64Array(simulationCount)

        for (let stepIndex = 0; stepIndex < totalSteps; stepIndex += 1) {
            for (let simulationIndex = 0; simulationIndex < simulationCount; simulationIndex += 1) {
                column[simulationIndex] = values[simulationIndex * totalSteps + stepIndex]
            }

            column.sort()

            p10[stepIndex] = percentileFromSorted(column, 0.1)
            p25[stepIndex] = percentileFromSorted(column, 0.25)
            p50[stepIndex] = percentileFromSorted(column, 0.5)
            p75[stepIndex] = percentileFromSorted(column, 0.75)
            p90[stepIndex] = percentileFromSorted(column, 0.9)
        }

        return { p10, p25, p50, p75, p90 }
    }

    function buildHistogram(sortedTerminalValues) {
        const count = sortedTerminalValues.length
        const minValue = sortedTerminalValues[0]
        const maxValue = sortedTerminalValues[count - 1]

        if (count === 0) {
            return { bins: [] }
        }

        if (minValue === maxValue) {
            const margin = Math.max(Math.abs(minValue) * 0.02, 1)
            return {
                bins: [
                    {
                        start: minValue - margin,
                        end: maxValue + margin,
                        count
                    }
                ]
            }
        }

        const binCount = Math.min(30, Math.max(18, Math.floor(Math.sqrt(count))))
        const width = (maxValue - minValue) / binCount
        const counts = new Array(binCount).fill(0)

        for (let index = 0; index < count; index += 1) {
            const value = sortedTerminalValues[index]
            const rawIndex = Math.floor((value - minValue) / width)
            const safeIndex = Math.min(binCount - 1, Math.max(0, rawIndex))
            counts[safeIndex] += 1
        }

        return {
            bins: counts.map((binValue, index) => ({
                start: minValue + index * width,
                end: minValue + (index + 1) * width,
                count: binValue
            }))
        }
    }

    function samplePaths(values, simulationCount, totalSteps) {
        const sampleCount = Math.min(40, simulationCount)
        const sampled = []

        for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
            const selectedIndex = sampleCount === 1
                ? 0
                : Math.floor((sampleIndex * (simulationCount - 1)) / (sampleCount - 1))
            const start = selectedIndex * totalSteps
            sampled.push(Array.from(values.slice(start, start + totalSteps)))
        }

        return sampled
    }

    function buildCrashBreakdown(crashCounts) {
        let zeroCount = 0
        let oneCount = 0
        let twoCount = 0
        let threePlusCount = 0

        for (let index = 0; index < crashCounts.length; index += 1) {
            const crashCount = crashCounts[index]
            if (crashCount === 0) {
                zeroCount += 1
                continue
            }
            if (crashCount === 1) {
                oneCount += 1
                continue
            }
            if (crashCount === 2) {
                twoCount += 1
                continue
            }
            threePlusCount += 1
        }

        const total = crashCounts.length
        return {
            zeroCrashRate: zeroCount / total,
            oneCrashRate: oneCount / total,
            twoCrashRate: twoCount / total,
            threePlusCrashRate: threePlusCount / total
        }
    }

    function percentileFromSorted(sortedValues, quantile) {
        const length = sortedValues.length
        if (length === 0) {
            return 0
        }

        if (length === 1) {
            return sortedValues[0]
        }

        const index = (length - 1) * quantile
        const lowerIndex = Math.floor(index)
        const upperIndex = Math.ceil(index)
        const weight = index - lowerIndex

        if (lowerIndex === upperIndex) {
            return sortedValues[lowerIndex]
        }

        return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
    }

    function validateConfig(config) {
        const fields = [
            'currentHolding',
            'monthlyInvestment',
            'expectedAnnualReturn',
            'investmentYears',
            'crashDrawdown',
            'crashIntervalYears',
            'annualVolatility',
            'simulationCount'
        ]

        const invalidField = fields.find(field => !Number.isFinite(config[field]))
        if (invalidField) {
            throw new Error('参数中存在无效数字，请重新输入。')
        }

        if (config.currentHolding < 0) {
            throw new Error('当前持有金额不能为负数。')
        }

        if (config.monthlyInvestment < 0) {
            throw new Error('每月定投金额不能为负数。')
        }

        if (config.expectedAnnualReturn <= -1) {
            throw new Error('预期年化收益率必须大于 -100%。')
        }

        if (!Number.isInteger(config.investmentYears) || config.investmentYears < 1 || config.investmentYears > 50) {
            throw new Error('投资年限必须在 1 到 50 年之间。')
        }

        if (config.crashDrawdown < 0 || config.crashDrawdown > 1) {
            throw new Error('极端回撤幅度必须在 0% 到 100% 之间。')
        }

        if (config.crashIntervalYears < 0.5 || config.crashIntervalYears > 200) {
            throw new Error('极端事件间隔必须在 0.5 到 200 年之间。')
        }

        if (config.annualVolatility < 0 || config.annualVolatility > 1) {
            throw new Error('年化波动率必须在 0% 到 100% 之间。')
        }

        if (
            !Number.isInteger(config.simulationCount) ||
            config.simulationCount < 1000 ||
            config.simulationCount > 10000 ||
            config.simulationCount % 1000 !== 0
        ) {
            throw new Error('模拟次数必须在 1000 到 10000 之间，并且以 1000 为步进。')
        }
    }

    function normalizeError(error) {
        if (error instanceof Error && error.message) {
            return error.message
        }

        return '后台计算失败，请稍后再试。'
    }

    let cachedNormal = null

    function randomNormal() {
        if (cachedNormal !== null) {
            const savedValue = cachedNormal
            cachedNormal = null
            return savedValue
        }

        let u = 0
        let v = 0
        let s = 0

        while (s === 0 || s >= 1) {
            u = Math.random() * 2 - 1
            v = Math.random() * 2 - 1
            s = u * u + v * v
        }

        const multiplier = Math.sqrt((-2 * Math.log(s)) / s)
        cachedNormal = v * multiplier
        return u * multiplier
    }

    globalScope.MonteCarloCalculatorCore = {
        runMonteCarlo,
        validateConfig,
        normalizeError
    }
})(typeof self !== 'undefined' ? self : window)
