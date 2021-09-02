import { widget } from '../assets/js/charting_library';
import { INTERVAL_SECONDS, getMaticPrice } from './Helpers'
import Web3 from 'web3'

const {
    REACT_APP_API_DOMAIN,
    REACT_APP_ROUTER_ADDRESS,
    REACT_APP_RPC_URL
} = process.env

 let web3 = new Web3(REACT_APP_RPC_URL)
const eth = web3.eth

const configurationData = {
    supported_resolutions: ['1', '5', '10', '15', '30', '60', '240', '720', '1440'],
};

const MAX_TXN_QUEUE_LENGTH = 100
const transactionQueue =[]
const pairs = []
var intervalId

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

const buildDatafeed = (pairInfo) => {
    return {
        onReady: (callback) => {
            setTimeout(() => callback(configurationData));
        },
        searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
            onResultReadyCallback([{
                symbol: '',
                full_name: '',
                description: '',
                exchange: '',
                typ: ''
            }])
        },
        resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
            setTimeout(() => onSymbolResolvedCallback({
                minmov: 1,
                pricescale: 100000,
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

            if(pairInfo.interval !== interval) {
                delete pairInfo.lastFrom
                pairInfo.interval = interval
            }

            var customFrom, customTo
            if(pairInfo.lastFrom) {
                customTo = pairInfo.lastFrom - seconds
                customFrom = customTo - 500 * seconds
            } else {
                customTo = 'latest'
                customFrom = Math.floor(new Date().getTime() / 1000) - 500 * seconds
            }

            pairInfo.lastFrom = customFrom
            fetch(`${REACT_APP_API_DOMAIN}/pair/${pairInfo.address}/interval/${interval}/start/${customFrom}/end/${customTo}`)
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
                    pairInfo.latestBar = data[data.length - 1]
                    setTimeout(() => onHistoryCallback(data, { nextTime: customFrom - seconds, noData: false }))
                    
                } else {
                    setTimeout(() => onHistoryCallback([], { noData: true }))
                }

            })


        },
        subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
            console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
            pairInfo.seconds = INTERVAL_SECONDS[convertResolution(resolution)]
            pairInfo.onRealtimeCallback = onRealtimeCallback
            pairInfo.subscribeUID = subscribeUID
            pairs.push(pairInfo)

        },
        unsubscribeBars: (subscriberUID) => {

            console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
            const pair = pairs.find(p => p.subscribeUID === subscriberUID)
            pairs.splice(pairs.indexOf(pair), 1)
        },

    }
}


const ChartManager = {

    startPolling: async () => {
        try {
        
            var stablePrice = await getMaticPrice()
            var currentLatestBlock = await eth.getBlockNumber()
            var block = await eth.getBlock(currentLatestBlock)
            while(!block) {
                block = await eth.getBlock(currentLatestBlock)
            }
            var blockTimestamp = block.timestamp
            var counter = 0;
            intervalId = setInterval(async function() {
    
                if(pairs.length > 0) {
                    try {
    
                        const routerTopic = `0x000000000000000000000000${REACT_APP_ROUTER_ADDRESS.substr(2)}`
                        const transactions = await eth.getPastLogs({
                            fromBlock: '0x' + currentLatestBlock.toString(16),
                            toBlock: 'latest',
                            address: pairs.map(p => p.address.toLowerCase()),
                            topics: [
                                web3.utils.sha3('Swap(address,uint256,uint256,uint256,uint256,address)'),
                                routerTopic
                            ]
                        })
        
                        const newTxns = []
                        for(var i = 0; i < transactions.length; i++) {
                            const { transactionHash, data, logIndex, blockNumber, address } = transactions[i]
                            const tid = transactionHash + logIndex
                            if (!transactionQueue.includes(tid)) {
                                const trunc = data.substr(2)
                                const chunks = []
                                for (var k = 0; k < 4; k++) {
                                    const chunk = trunc.substr(k * 64, 64)
                                    chunks.push(parseInt("0x" + chunk))
                                }

                                const pair = pairs.find(p => p.address.toLowerCase() === address.toLowerCase())
        
                                const isTarget0 = pair.isTarget0
                                var targetTokenAmount = 0, stableTokenAmount = 0, type;
                                if (chunks[1] && chunks[2]) {
                                    type = isTarget0 ? 'BUY' : 'SELL'
                                    targetTokenAmount = chunks[isTarget0 ? 2 : 1] / 10 ** pair.targetToken.decimals
                                    stableTokenAmount = chunks[isTarget0 ? 1 : 2] / 10 ** pair.stableToken.decimals
                                } else if (chunks[0] && chunks[3]) {
                                    type = isTarget0 ? 'SELL' : 'BUY'
                                    targetTokenAmount = chunks[isTarget0 ? 0 : 3] / 10 ** pair.targetToken.decimals
                                    stableTokenAmount = chunks[isTarget0 ? 3 : 0] / 10 ** pair.stableToken.decimals
                                } else {
                                    continue
                                }
        
                                console.info(`Exchange ${stableTokenAmount} MATIC for ${targetTokenAmount} ${pair.targetToken.symbol}`)
                                const amountSpentUSD = stableTokenAmount * stablePrice
                                if(targetTokenAmount && stableTokenAmount) {
                                    const price = amountSpentUSD / targetTokenAmount
                                    const timestamp = (blockNumber - currentLatestBlock) * 2.5 + blockTimestamp
                                    const transaction = {
                                        type,
                                        transactionHash,
                                        logIndex,
                                        targetTokenAmount,
                                        stableTokenAmount,
                                        totalSpent: amountSpentUSD,
                                        price,
                                        timestamp,
                                        address
                                    }
                                    newTxns.unshift(transaction)
                                }
        
                                transactionQueue.unshift(tid)
                                if(transactionQueue.length > MAX_TXN_QUEUE_LENGTH) {
                                    transactionQueue.pop()
                                }
                                
                            }
                        }

                        if(newTxns.length > 0) {                            
                            for(var i = 0; i < newTxns.length; i ++) {
                                const transaction = newTxns[i]
                                const pair = pairs.find(p => p.address.toLowerCase() === transaction.address.toLowerCase())
                                const latestBar = pair.latestBar
                                var txTime = Math.floor(transaction.timestamp / pair.seconds) * pair.seconds * 1000
                                if (latestBar && txTime === latestBar.time) {
                                    latestBar.close = transaction.price
                                    if (transaction.price > latestBar.high) {
                                        latestBar.high = transaction.price
                                    }
            
                                    if (transaction.price < latestBar.low) {
                                        latestBar.low = transaction.price
                                    }
            
                                    latestBar.volume += transaction.totalSpent
                                    pair.onRealtimeCallback(latestBar)
                                } else if (latestBar && txTime > latestBar.time) {
                                    const newBar = {
                                        low: transaction.price,
                                        high: transaction.price,
                                        open: transaction.price,
                                        close: transaction.price,
                                        volume: transaction.totalSpent,
                                        time: txTime
                                    }
                                    pair.latestBar = newBar
                                    pair.onRealtimeCallback(newBar)
                                }
            
                            }
                        }

                        if(counter % 20 === 1) {
                            currentLatestBlock = await eth.getBlockNumber()
                            currentLatestBlock -= 1
                            blockTimestamp = (await eth.getBlock(currentLatestBlock)).timestamp
                            console.info(`New from block number: ${currentLatestBlock} at ${blockTimestamp} seconds.`)
                            stablePrice = await getMaticPrice()
                        }
        
                    } catch (e) {
                        console.log(e.stack)
                    }
                }
    
                counter++
            }, 10000)
        } catch (e) {
            console.log(e.stack)
        }
    },

    stopPolling: () => {
        if(intervalId) {
            clearInterval(intervalId)
            intervalId = null
        }
    },

    addChart: (elementId, pair) => {
        const tokenInfo = pair.targetToken
        const stableTokenInfo = pair.stableToken
        const chartWidget = new widget({
            symbol: `${tokenInfo.symbol}/${stableTokenInfo.symbol}`, // default symbol
            interval: '5', // default interval
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            container_id: elementId,
            datafeed: buildDatafeed(pair),
            library_path: '/charting_library/',
            disabled_features: ['header_symbol_search', 'symbol_search_hot_key', 'timeframes_toolbar'],
            theme: "Dark",
            timeframe: '1D',
            autosize: true,
        });

        // chartWidget.onChartReady(() => {
        //     chartWidget.activeChart().onVisibleRangeChanged().subscribe(
        //         null,
        //         ({ from, to }) => console.log(from,to)
        //     )    
        // })

        pair.chart = chartWidget
        return chartWidget
    },

    removeChart: () => {
        
    }

}

export default ChartManager