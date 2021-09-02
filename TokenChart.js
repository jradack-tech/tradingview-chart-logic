import { useEffect, useState } from 'react';
import { useAccount } from "../../contexts/AccountProvider"
import { getDecimalPlaces, getDeadBalance, STABLE_PAIRS } from "../../util/Helpers"
import {
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Row,
  Col,
  Table
} from "reactstrap";
import { widget } from '../../assets/js/charting_library';
import buildDatafeed from '../../assets/js/datafeed.js'
import maticIcon from '../../assets/img/matic-icon.png'
import quickswapIcon from '../../assets/img/quickswap.png'
import dfynIcon from '../../assets/img/dfyn.png'
import polyzapIcon from '../../assets/img/polyzap.png'
import favoriteIcon from '../../assets/img/favorite.png'
import notFavoriteIcon from '../../assets/img/notfavorite.png'

import { numberWithCommas } from '../../util/Helpers'
// nodejs library that concatenates classes
import classNames from "classnames";

const TokenChart = ({ pairInfo, routerAddress, exchange }) => {

  const [currentPrice, setCurrentPrice] = useState(0)
  const [marketCap, setMarketCap] = useState(0)
  const [circulatingSupply, setCirculatingSupply] = useState(0)
  const [amountLiquidity, setAmountLiquidity] = useState(0)
  const [amountLiquidityDollars, setAmountLiquidityDollars] = useState(0)
  const [transactionsList, setTransactionsList] = useState([])
  const [selectedStableSymbol, setSelectedStableSymbol] = useState(pairInfo.stableToken.symbol)

  const MAX_TRANSACTIONS = 200

  const [notified, setNotified] = useState(false)

  const tokenInfo = pairInfo.targetToken
  const stableTokenInfo = pairInfo.stableToken

  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });


  const handleExchangeClick = function (newExchange) {
    if (newExchange !== exchange) {
      var url = `/token/${tokenInfo.address}?`
      if (newExchange === 'PolyZap') {
        url += 'exchange=PolyZap&'
      } else if (newExchange === 'DFYN') {
        url += 'exchange=DFYN&'
      }

      if(selectedStableSymbol !== 'WMATIC') {
        url += `pairedWith=${selectedStableSymbol}`
      }

      window.location.href = url
    }
  }

  const { notify } = useAccount()
  // initial data fetching
  useEffect(() => {
    const handleTransactions = function (transactions) {
      setTransactionsList((oldTransactions) => {
        let newTransactions = [...transactions, ...oldTransactions]
        return newTransactions.slice(0, MAX_TRANSACTIONS)
      })
    }

    const handleLiquidityChange = function (amtLiq, amtLiqDollars) {
      setAmountLiquidity((old) => amtLiq)
      setAmountLiquidityDollars((old) => amtLiqDollars)
      if (amtLiqDollars < 10 && !notified) {
        notify({
          place: 'tc',
          message: (
            <div>
              <div>
                <b>There is not enough {tokenInfo.symbol}/{stableTokenInfo.symbol} liquidity on this exchange for QuickChart to accurately track its price. </b>
              </div>
            </div>
          ),
          type: 'danger',
          icon: "tim-icons icon-bell-55",
        })
        setNotified(true)
      }
    }

    const loadChart = async () => {

      var deadBalanceCache = window.localStorage.getItem('dead-balance-cache')
      deadBalanceCache = deadBalanceCache ? JSON.parse(deadBalanceCache) : {}
      var burnedBalance
      if(deadBalanceCache[tokenInfo.address.toLowerCase()] !== undefined && deadBalanceCache[tokenInfo.address.toLowerCase()].createdAt > new Date().getTime() - 6 * 60 * 60 * 1000) {
        console.log('Found dead balance in cache')
        burnedBalance = deadBalanceCache[tokenInfo.address.toLowerCase()].burnedBalance
      } else {
        console.log('Dead balance not found in cache')
        burnedBalance = await getDeadBalance(tokenInfo)
        deadBalanceCache[tokenInfo.address.toLowerCase()] = {
            burnedBalance,
            createdAt: new Date().getTime()
        }
        window.localStorage.setItem('dead-balance-cache', JSON.stringify(deadBalanceCache))
      }

      const handlePriceChange = function (latestPrice) {
        const circSupply = tokenInfo.totalSupply - burnedBalance
        const mc = circSupply * latestPrice
        setMarketCap(mc)
        setCirculatingSupply(circSupply)
        setCurrentPrice(latestPrice)
      }

      const r = await fetch(`${stableTokenInfo.url}/transactions/${pairInfo.address}`)
      const transactions =  await r.json()
      setTransactionsList(transactions)

      var pricescale = 100000
      if(transactions.length > 0) {
        pricescale = 10 ** (getDecimalPlaces(transactions[0].price))
      }
      // const tvWidget
      new widget({
        symbol: `${tokenInfo.symbol}/${stableTokenInfo.symbol}`, // default symbol
        interval: '5', // default interval
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        container_id: 'TVChartContainer',
        datafeed: buildDatafeed(pairInfo, routerAddress, pricescale, handleTransactions, handleLiquidityChange, handlePriceChange),
        library_path: '/charting_library/',
        disabled_features: ['header_symbol_search', 'symbol_search_hot_key', 'timeframes_toolbar'],
        theme: "Dark",
        timeframe: '1D',
        width: '100%',
        height: 700
        //autosize: true,
      });


    }

    loadChart()

    // tvWidget.onChartReady(() => {
    // 	tvWidget.headerReady().then(() => {
    // 		const button = tvWidget.createButton();
    // 		button.setAttribute('title', 'Click to show a notification popup');
    // 		button.classList.add('apply-common-tooltip');
    // 		button.addEventListener('click', () => tvWidget.showNoticeDialog({
    // 			title: 'Notification',
    // 			body: 'TradingView Charting Library API works correctly',
    // 			callback: () => {
    // 				console.log('Noticed!');
    // 			},
    // 		}));

    // 		button.innerHTML = 'Check API';
    // 	});
    // });
  }, [])

  useEffect(() => {
    document.title = `${tokenInfo.symbol} ${numberWithCommas(currentPrice.toFixed(10))} | Quick Chart`
  }, [tokenInfo, currentPrice])

  // const stableTokenChanged = (e) => {
  //   setSelectedStableSymbol(e.target.value)
  //   var url = `/token/${tokenInfo.address}?`
  //   if(exchange !== 'QuickSwap') {
  //     url += `exchange=${exchange}&`
  //   }

  //   if(e.target.value !== 'WMATIC') {
  //     url += `pairedWith=${e.target.value}`
  //   }

  //   window.location.href = url
  // }

  const filteredPairs = Object.keys(STABLE_PAIRS).filter(symbol => symbol !== tokenInfo.symbol)
  return (
    <Card className="card-chart">
      <CardHeader>
        <Row>
          <Col className="text-left" sm="4">
            <CardTitle tag="h2">
              <div style={{ paddingTop: '3px' }}>{tokenInfo.symbol} / {selectedStableSymbol}</div>
              <div style={{ fontSize: '12px', display: 'flex', marginTop: '5px' }}>
                {filteredPairs.map((symbol) => (
                  <>
                    <input
                      id={symbol}
                      key={symbol}
                      type="radio"
                      name="symbol"
                      value={symbol}
                      onChange={stableTokenChanged}
                      checked={symbol === selectedStableSymbol}
                      style={{ marginRight: '0.2em' }}
                    />
                    <label htmlFor={symbol} style={{ marginRight: '1em' }}>{symbol}</label>
                  </>
                ))}
              </div>
            </CardTitle>
          </Col>
          <Col sm="4"></Col>
          <Col sm="4">
            <a
              style={{ margin: 0, padding: '10px' }}
              className='btn'
              target='_blank'
              rel='noreferrer'
              href={`https://quickswap.exchange/#/swap?outputCurrency=${tokenInfo.address}`}
            >
              <img style={{ marginRight: '10px' }} alt="QuickSwap" src={quickswapIcon} width="30px" height="30px" />Buy
            </a>
            <ButtonGroup
              className="btn-group-toggle float-right"
              data-toggle="buttons"
            >
              <Button
                tag="label"
                className={classNames("btn-simple", {
                  active: exchange === 'QuickSwap',
                })}
                color="info"
                id="0"
                size="sm"
                onClick={() => handleExchangeClick('quickswap')}
              >
                <span className="d-block d-sm-none d-md-block d-lg-block d-xl-block">
                  <img alt="QuickSwap" src={quickswapIcon} width="15px" height="15px" />
                </span>
                <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                  QuickSwap
                                </span>
              </Button>
              <Button
                color="info"
                id="1"
                size="sm"
                tag="label"
                className={classNames("btn-simple", {
                  active: exchange === 'PolyZap',
                })}
                onClick={() => handleExchangeClick('PolyZap')}
              >
                <span className="d-block d-sm-none d-md-block d-lg-block d-xl-block">
                  <img alt="PolyZap" src={polyzapIcon} width="15px" height="15px" />
                </span>
                <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                  PolyZap
                                </span>
              </Button>
              <Button
                color="info"
                id="1"
                size="sm"
                tag="label"
                className={classNames("btn-simple", {
                  active: exchange === 'DFYN',
                })}
                onClick={() => handleExchangeClick('DFYN')}
              >
                <span className="d-block d-sm-none d-md-block d-lg-block d-xl-block">
                  <img alt="DFYN" src={dfynIcon} width="15px" height="15px" />
                </span>
                <span className="d-none d-sm-block d-md-block d-lg-block d-xl-block">
                  DFYN
                                </span>
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
        <Row>
          <Col className="text-left" lg="3">
            <h5 className="card-category">Price: ${numberWithCommas(currentPrice.toFixed(10))}</h5>
            <h5 className="card-category">Market Cap: {formatter.format(marketCap)}</h5>
          </Col>
          <Col className="text-left" lg="3">
            <h5 className="card-category">Circulating Supply: {numberWithCommas(circulatingSupply.toFixed(2))} {tokenInfo.symbol}</h5>
            <h5 className="card-category">Liquidity: {numberWithCommas(amountLiquidity.toFixed(2))} {stableTokenInfo.symbol} ({formatter.format(amountLiquidityDollars)})</h5>
          </Col>
        </Row>
        <Row>
          <Col className="text-left" sm="6">
            <h5 className="card-category">
              <a rel="noreferrer" target="_blank" href={`https://explorer-mainnet.maticvigil.com/tokens/${tokenInfo.address}/token-holders`}>Holders</a>
              <a rel="noreferrer" target="_blank" href={`https://explorer-mainnet.maticvigil.com/tokens/${pairInfo.address}/token-holders`} style={{ marginLeft: '30px' }}>LP Holders</a>
              <a rel="noreferrer" target="_blank" href={`https://explorer-mainnet.maticvigil.com/address/${tokenInfo.address}/contracts`} style={{ marginLeft: '30px' }}>Contract</a>
            </h5>
          </Col>
        </Row>
      </CardHeader>
      <CardBody>
        <div id="TVChartContainer" className="TVChartContainer">
        </div>
        <br />
        <hr style={{ backgroundColor: 'grey' }} />
        <h3>Transactions</h3>
        <Table >
          <thead>
            <tr>
              <th>Buy/Sell</th>
              <th>Tokens</th>
              <th>Price</th>
              <th>Price per {tokenInfo.symbol}</th>
              <th>Time</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody >
            {
              transactionsList.map((t, i) => {
                return <tr key={t.transactionHash + t.logIndex + i}>
                  <td style={{ color: t.type === 'BUY' ? 'green' : 'red' }}>{t.type}</td>
                  <td>{t.targetTokenAmount}</td>
                  <td>${numberWithCommas(t.totalSpent.toFixed(2))}</td>
                  <td>${(t.totalSpent / t.targetTokenAmount).toFixed(getDecimalPlaces(t.totalSpent / t.targetTokenAmount))}</td>
                  <td>{new Date(t.timestamp * 1000).toLocaleString([], { hour12: true })}</td>
                  <td><a rel="noreferrer" href={`https://explorer-mainnet.maticvigil.com/tx/${t.transactionHash}/token-transfers`} target="_blank"><img alt="View Transaction" src={maticIcon} /></a></td>
                </tr>
              })
            }
          </tbody>
        </Table>

      </CardBody>
    </Card>
  );
}

export default TokenChart;
