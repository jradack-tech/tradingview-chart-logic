import { pollPrices, endPolling, INTERVAL_SECONDS } from "../../util/Helpers";

const configurationData = {
    supported_resolutions: ['1', '5', '10', '15', '30', '60', '240', '720', '1440'],
};


export default function buildDatafeed(pairInfo, routerAddress, pricescale, handleTransactions, handleLiquidityChange, handlePriceChange) {
    
    var lastFrom
    var latestBar
    var initialPriceSet = false

    function convertResolution(resolution) {
        var interval
        if(resolution === '1') {
            interval = '1m'
        } else if(resolution === '5') {
            interval = '5m'
        } else if (resolution === '10') {
            interval = '10m'
        } else if (resolution === '15') {
            interval = '15m'
        } else if( resolution ==='30') {
            interval = '30m'
        } else if(resolution === '60') {
            interval = '1h'
        } else if (resolution === '240') {
            interval = '4h'
        } else if (resolution === '720') {
            interval = '12h'
        } else if (resolution === '1440') {
            interval = '24h'
        } else {
            interval = resolution
        }
        return interval
    }

    return {
        onReady: (callback) => {
            setTimeout(() => callback(configurationData));
        },
        searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            onResultReadyCallback([{
                symbol: 'test1',
                full_name: 'test test',
                description: 'test desc',
                exchange: 'exchange test',
                typ: 'crypto'
            }])
        },
        resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            setTimeout(() => onSymbolResolvedCallback({
                minmov: 1,
                pricescale,
                name: symbolName,
                ticker: symbolName,
                session: '24x7',
                timezone: 'America/New_York',
                description: '',
                supported_resolution:  ['1', '5', '10', '15', '30', '60', '240', '720', '1440'],
                has_intraday: true,
                intraday_multipliers:  ['1', '5', '10', '15', '30', '60', '240', '720', '1440'],
                volume_precision: 2,
            }))
        },
        getBars: (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, isFirstRequest) => {

            var interval = convertResolution(resolution)
            const seconds = INTERVAL_SECONDS[interval]


            var customFrom, customTo
            if(lastFrom) {
                customTo = lastFrom - seconds
                customFrom = customTo - 500 * seconds
            } else {
                customTo = 'latest'
                customFrom = Math.floor(new Date().getTime() / 1000) - 500 * seconds
            }

            lastFrom = customFrom
            fetch(`${pairInfo.stableToken.url}/pair/${pairInfo.address}/interval/${interval}/start/${customFrom}/end/${customTo}`)
            .then(r => r.json())
            .then(priceData => {
                var data = priceData.filter(p => {
                    return (p && p.time && p.open && p.close && p.low && p.high)
                }).map(p => {
                    var date
                    if(isNaN(p.time)) {
                        date = new Date(p.time)
                    } else {
                        date = new Date(p.time * 1000)
                    }
                    return {
                        time: date.getTime(),
                        open: p.open,
                        close: p.close,
                        low: p.low,
                        high: p.high,
                        volume: p.volume
    
                    }
                })
                if(data.length > 0) {
                    latestBar = data[data.length - 1]
                    setTimeout(() => onHistoryCallback(data, { nextTime: customFrom - seconds, noData: false }))
                    if(!initialPriceSet) {
                        handlePriceChange(latestBar.close)
                        initialPriceSet = true
                    }
                    
                } else {
                    setTimeout(() => onHistoryCallback([], { noData: true }))
                }

            })


        },
        subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
            console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
            const seconds = INTERVAL_SECONDS[convertResolution(resolution)]
            pollPrices(pairInfo, routerAddress, function(transactions) {
                handleTransactions(transactions)
                if(transactions.length > 0) {
                    handlePriceChange(transactions[transactions.length - 1].price)
                }

                for(var i = 0; i < transactions.length; i ++) {
                    const transaction = transactions[i]
                    var txTime = Math.floor(transaction.timestamp / seconds) * seconds * 1000
                    if (latestBar && txTime === latestBar.time) {
                        latestBar.close = transaction.price
                        if (transaction.price > latestBar.high) {
                            latestBar.high = transaction.price
                        }

                        if (transaction.price < latestBar.low) {
                            latestBar.low = transaction.price
                        }

                        latestBar.volume += transaction.totalSpent
                        onRealtimeCallback(latestBar)
                    } else if (latestBar && txTime > latestBar.time) {
                        const newBar = {
                            low: transaction.price,
                            high: transaction.price,
                            open: transaction.price,
                            close: transaction.price,
                            volume: transaction.totalSpent,
                            time: txTime
                        }
                        latestBar = newBar
                        onRealtimeCallback(newBar)
                    }

                }
                
            }, handleLiquidityChange)
        },
        unsubscribeBars: (subscriberUID) => {
            console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
            endPolling()
            lastFrom = null
        },

    }
}