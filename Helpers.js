import Web3 from 'web3'
import polylion from "../assets/banner/polylion.gif";
import polypepe from "../assets/banner/polypepe.jpg";
import polyshibu from "../assets/banner/polyshibu.jpg";
import pandamafia from "../assets/banner/pandamafia.png";
import spacerat from "../assets/banner/spacerat.gif";


const { 
    REACT_APP_API_DOMAIN,
    REACT_APP_QUICK_CHART_ADDRESS,
    REACT_APP_MATIC_USDC_PAIR_ADDRESS,
    REACT_APP_STABLE_TOKEN_ADDRESS,
    REACT_APP_PAIR_ABI_FILE,
    REACT_APP_FACTORY_ADDRESS,
    REACT_APP_FACTORY_ABI_FILE,
    REACT_APP_TOKEN_ABI_FILE,
    REACT_APP_RPC_URL,
    REACT_APP_BACKUP_RPC_URL,
    REACT_APP_ROUTER_ADDRESS,
} = process.env

let web3 = new Web3(REACT_APP_RPC_URL)
let eth = web3.eth

eth.getBlockNumber()
.catch(e => {
    console.log("using backup RPC")
    web3 = new Web3(REACT_APP_BACKUP_RPC_URL)
    eth = web3.eth
})


export const ads = [
    {
        address: '0x2BCE88C30F58AFc033dcbCFcA0DE5cB676b2cdfD',
        banner: polypepe,
        balance: 0.8255,
        link: 'https://t.me/polypepe'
    },
    {
        address: '0xcF18357E9Bb90D00747B06796f830c0eA4Da1e69',
        banner: polylion,
        balance: 0.923,
        link: 'https://polylion.exchange/'
    },
    {
        address: '0x00A5af2D7DA07dF76073A6f478f0fB4942D2659a',
        banner: polyshibu,
        balance: 0.655,
        link: 'https://quickswap.exchange/#/swap?inputCurrency=0x7649b5362881e1b71d5b360Fb9B1f7A8eea1989A'
    },
    {
        address: '0x6587D861B7cEa89E0E78AE4897a1A757bB40Cee5',
        banner: pandamafia,
        balance: 1.2,
        link: 'https://t.me/pandamafiamatic'
    },
    {
        address: '0x3122418EDADCCb1D7939Ad3461b3d58a33a3b1E1',
        banner: spacerat,
        balance: 0.302,
        link: 'https://t.me/SpaceRatPolygon'
    }
]

export const STABLE_PAIRS = {
    'QUICK': {
        url: 'https://quick.quickchart.app',
        usdcPairAddress: '0x1f1e4c845183ef6d50e9609f16f6f9cae43bc9cb',
        isUsdc0: true,
        address: '0x831753dd7087cac61ab5644b308642cc1c33dc13',
        decimals: 18,
        totalSupply: 969921238602816762893860,
        symbol: 'QUICK'
    },
    'WETH': {
        url: 'https://eth.quickchart.app',
        usdcPairAddress: '0x853ee4b2a13f8a742d64c8f088be7ba2131f670d',
        isUsdc0: true,
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        decimals: 18,
        totalSupply: 728393509275245501990508 ,
        symbol: 'WETH'
    },
    'WMATIC': {
        url: 'https://api.quickchart.app',
        usdcPairAddress: '0x6e7a5fafcec6bb1e78bae2a1f0b612012bf14827',
        isUsdc0: false,
        address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
        decimals: 18,
        totalSupply: 441009357764704837716022596,
        symbol: 'WMATIC'
    }
}

export const INTERVAL_SECONDS = {
    '1m': 60,
    '5m': 300,
    '10m': 600,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '12h': 43200,
    '24h': 86400
}

export function getDecimalPlaces(num) {
    var decimals = 2
    var compare = 10

    if(num <= 0) {
        return 2
    }

    while(num < compare) {
        compare = compare / 10
        decimals += 1
    }
    return decimals
}

export function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

export async function getTokenPrice(address) {

    const factory = await getFactoryContract(REACT_APP_FACTORY_ADDRESS)

    const pairAddress = await factory.methods.getPair(address, REACT_APP_STABLE_TOKEN_ADDRESS).call()
    const r = await fetch(`${REACT_APP_API_DOMAIN}/price/${pairAddress}`)
    const result = await r.json()
    return result.price
}

export async function getTokenPair(token1, token2) {
    const factory = await getFactoryContract(REACT_APP_FACTORY_ADDRESS)
    return await factory.methods.getPair(token1, token2).call()
}

export async function getFactoryContract(address) {
    const r = await fetch(`/abi/${REACT_APP_FACTORY_ABI_FILE}`);
    const abi = await r.json()
    return new eth.Contract(abi, address)
}

export async function getTokenContract(address) {
    const r = await fetch(`/abi/${REACT_APP_TOKEN_ABI_FILE}`);
    const abi = await r.json()
    return new eth.Contract(abi, address)
}

export async function getPairContract(address) {
    const r = await fetch(`/abi/${REACT_APP_PAIR_ABI_FILE}`);
    const abi = await r.json()
    return new eth.Contract(abi, address)
}

export async function getTokenInfo(address) {

    const token = await getTokenContract(address)
    const result = await Promise.all([
        token.methods.decimals().call(),
        token.methods.symbol().call(),
        token.methods.name().call(),
        token.methods.totalSupply().call(),
        address
    ])

    const decimals = +result[0]
    return {
        address: address.toLowerCase(),
        decimals,
        symbol: result[1],
        name: result[2],
        totalSupply: +result[3] / (10 ** decimals)
    }
}

export async function getQuickChartBalance(address) {

    const token = await getTokenContract(REACT_APP_QUICK_CHART_ADDRESS)
    var balance = await token.methods.balanceOf(address).call()
    balance = balance / 10 ** 9

    return balance
}

export async function getDeadBalance(tokenInfo) {
    const deadAddresses = ['0xffffffffffffffffffffffffffffffffffffffff', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000001', '0x000000000000000000000000000000000000dEaD']
    const token = await getTokenContract(tokenInfo.address);
    var balance = 0;
    for(var i = 0; i < deadAddresses.length; i++) {
        balance += +(await token.methods.balanceOf(deadAddresses[i]).call())
    }
    return balance / 10 ** tokenInfo.decimals
}

const MAX_TXN_QUEUE_LENGTH = 100
const transactionQueue =[]
var setIntervalId;

export async function endPolling() {
    if(setIntervalId) {
        clearInterval(setIntervalId)
        setIntervalId = null
    }
}

export async function pollPrices(pairInfo, routerAddress, onNewTransactions, onLiquidityChange, onPriceChange) {
    console.log('polling prices')
    try {

        var {isTarget0, stableToken, targetToken} = pairInfo

        var stablePrice = await getStablePrice(stableToken)
        var currentLatestBlock = await eth.getBlockNumber()
        var blockTimestamp = (await eth.getBlock(currentLatestBlock)).timestamp
        var counter = 0;
        const pair = await getPairContract(pairInfo.address)

        const getLiquidity = async function() {
            const result = await pair.methods.getReserves().call()
            const reserve1 = result._reserve1
            const reserve0 = result._reserve0

            var stableTokenAmtLiq
            if(isTarget0) {
                stableTokenAmtLiq = reserve1 / 10 ** stableToken.decimals
            } else {
                stableTokenAmtLiq = reserve0 / 10 ** stableToken.decimals
            }
            onLiquidityChange(stableTokenAmtLiq, stablePrice * stableTokenAmtLiq)
        }
        getLiquidity()

        if(setIntervalId) {
            console.log("turning off interval")
            clearInterval(setIntervalId)
        }

        
        setIntervalId = setInterval(async function() {

            try {

                if(counter % 6 === 5 || new Date().getTime()/1000 - blockTimestamp > 5 * 60 ) {
                    currentLatestBlock = await eth.getBlockNumber()
                    currentLatestBlock -= 1
                    blockTimestamp = (await eth.getBlock(currentLatestBlock)).timestamp
                    console.info(`New from block number: ${currentLatestBlock} at ${blockTimestamp} seconds.`)
                }

                const routerTopic = `0x000000000000000000000000${routerAddress.substr(2)}`
                const transactions = await eth.getPastLogs({
                    fromBlock: '0x' + currentLatestBlock.toString(16),
                    toBlock: 'latest',
                    address: pairInfo.address.toLowerCase(),
                    topics: [
                        web3.utils.sha3('Swap(address,uint256,uint256,uint256,uint256,address)'),
                        routerTopic
                    ]
                })

                const newTxns = []
                for(var i = 0; i < transactions.length; i++) {
                    const { transactionHash, data, logIndex, blockNumber } = transactions[i]
                    const tid = transactionHash + logIndex
                    if (!transactionQueue.includes(tid)) {
                        const trunc = data.substr(2)
                        const chunks = []
                        for (var k = 0; k < 4; k++) {
                            const chunk = trunc.substr(k * 64, 64)
                            chunks.push(parseInt("0x" + chunk))
                        }

                        var targetTokenAmount = 0, stableTokenAmount = 0, type;
                        if (chunks[1] && chunks[2]) {
                            type = isTarget0 ? 'BUY' : 'SELL'
                            targetTokenAmount = chunks[isTarget0 ? 2 : 1] / 10 ** targetToken.decimals
                            stableTokenAmount = chunks[isTarget0 ? 1 : 2] / 10 ** stableToken.decimals
                        } else if (chunks[0] && chunks[3]) {
                            type = isTarget0 ? 'SELL' : 'BUY'
                            targetTokenAmount = chunks[isTarget0 ? 0 : 3] / 10 ** targetToken.decimals
                            stableTokenAmount = chunks[isTarget0 ? 3 : 0] / 10 ** stableToken.decimals
                        } else {
                            continue
                        }

                        console.info(`Exchange ${stableTokenAmount} MATIC for ${targetTokenAmount} ${targetToken.symbol}`)
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
                                timestamp
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
                    onNewTransactions(newTxns)
                }

                if(counter % 20 === 19) {
                    stablePrice = await getStablePrice(stableToken)
                    getLiquidity()
                }

            } catch (e) {
                console.log(e.stack)
            }


            counter++
        }, 10000)
    } catch (e) {
        console.log(e.stack)
    }
}

export async function getMaticPrice() {

    var blockNum = await eth.getBlockNumber()
    
    const routerTopic = `0x000000000000000000000000${REACT_APP_ROUTER_ADDRESS.substr(2)}`
    var transactions = await eth.getPastLogs({
        address: REACT_APP_MATIC_USDC_PAIR_ADDRESS,
        fromBlock: '0x' + (blockNum - 500).toString(16),
        toBlock: '0x' + blockNum.toString(16),
        topics: [
            web3.utils.sha3('Swap(address,uint256,uint256,uint256,uint256,address)'),
            routerTopic
        ]
    })

    //sort in reverse order by block number
    transactions = transactions.sort((a, b) => (a.blockNumber > b.blockNumber) ? -1 : 1)

    for(var i = 0; i < transactions.length; i++) {
        const { data } = transactions[i]
        const trunc = data.substr(2)
        const chunks = []
        for (var k = 0; k < 4; k++) {
            const chunk = trunc.substr(k * 64, 64)
            chunks.push(parseInt("0x" + chunk))
        }

        var maticAmount = 0, usdcAmount = 0;
        if (chunks[1] && chunks[2]) {
            maticAmount = chunks[2] / 10 ** 18
            usdcAmount = chunks[1] / 10 ** 6
        } else if (chunks[0] && chunks[3]) {
            maticAmount = chunks[0] / 10 ** 18
            usdcAmount = chunks[3] / 10 ** 6
        } else {
            continue
        }

        if(usdcAmount > 1) {
            const maticPrice = usdcAmount / maticAmount
            console.log(`Found MATIC price: $${maticPrice}`)
            return maticPrice
        }

    }

    throw new Error('Could not find initial stable price')
  }

export async function getStablePrice(stableTokenInfo) {

    const { isUsdc0, usdcPairAddress, decimals } = stableTokenInfo

    var blockNum = await eth.getBlockNumber()
    
    const routerTopic = `0x000000000000000000000000${REACT_APP_ROUTER_ADDRESS.substr(2)}`
    var transactions = await eth.getPastLogs({
        address: usdcPairAddress,
        fromBlock: '0x' + (blockNum - 500).toString(16),
        toBlock: '0x' + blockNum.toString(16),
        topics: [
            web3.utils.sha3('Swap(address,uint256,uint256,uint256,uint256,address)'),
            routerTopic
        ]
    })

    //sort in reverse order by block number
    transactions = transactions.sort((a, b) => (a.blockNumber > b.blockNumber) ? -1 : 1)

    for(var i = 0; i < transactions.length; i++) {
        const { data } = transactions[i]
        const trunc = data.substr(2)
        const chunks = []
        for (var k = 0; k < 4; k++) {
            const chunk = trunc.substr(k * 64, 64)
            chunks.push(parseInt("0x" + chunk))
        }

        var stableAmount = 0, usdcAmount = 0;
        if (chunks[1] && chunks[2]) {
            stableAmount = chunks[isUsdc0 ? 1 : 2] / 10 ** decimals
            usdcAmount = chunks[isUsdc0 ? 2 : 1] / 10 ** 6
        } else if (chunks[0] && chunks[3]) {
            stableAmount = chunks[isUsdc0 ? 3 : 0] / 10 ** decimals
            usdcAmount = chunks[isUsdc0 ? 0 : 3] / 10 ** 6
        } else {
            continue
        }

        if(usdcAmount > 1) {
            const stablePrice = usdcAmount / stableAmount
            console.log(`Found stable price: $${stablePrice}`)
            return stablePrice
        }

    }

    throw new Error('Could not find initial stable price')
  }