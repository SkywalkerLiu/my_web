importScripts('tools-monte-carlo-core.js')

self.addEventListener('message', event => {
    const data = event.data || {}
    if (data.type !== 'run') {
        return
    }

    try {
        const result = self.MonteCarloCalculatorCore.runMonteCarlo(data.payload)
        self.postMessage({
            type: 'result',
            requestId: data.requestId,
            payload: result
        })
    } catch (error) {
        self.postMessage({
            type: 'error',
            requestId: data.requestId,
            message: self.MonteCarloCalculatorCore.normalizeError(error)
        })
    }
})
