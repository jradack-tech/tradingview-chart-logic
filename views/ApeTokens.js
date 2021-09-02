import { useState, useEffect } from 'react';
import { getTokenInfo, getTokenPair, getDecimalPlaces, numberWithCommas } from "../util/Helpers"
import { gql, useQuery } from '@apollo/client'
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
    Table
} from "reactstrap";

import { ApolloClient, InMemoryCache } from '@apollo/client';

import AdBanner from "../components/AdBanner"
import loadingSpinner from "../assets/img/loading.gif";

const client = new ApolloClient({
    uri: 'https://api.thegraph.com/subgraphs/name/sameepsi/quickswap',
    cache: new InMemoryCache()
})

var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

const stableCoins = ['WMATIC', 'DAI', 'USDC', 'WETH']

const ApeTokens = () => {

    const [isLoading, setIsLoading] = useState(true)
    const [newPairs, setNewPairs] = useState([])

    const createdTimestamp = Math.floor(new Date().getTime() / 1000) - 96 * 60 * 60


      useEffect(() => {
          client.query({
              query: gql`{
                pairs(
                  first: 100
                  where: {
                    createdAtTimestamp_gte: ${createdTimestamp}
                    volumeUSD_gte: 1
                    txCount_gte: 1
                    reserveUSD_gte: 1
                  }
                ) {
                  id
                  token0 {
                    id
                    name
                    symbol
                    tradeVolumeUSD
                  }
                  token1 {
                    id
                    name
                    symbol
                    tradeVolumeUSD
                  }
                  volumeUSD
                  txCount
                  reserveUSD
                  createdAtTimestamp
                }
              }`
          })
          .then(result => {
            const pairs = result.data.pairs.filter(p => {
                return stableCoins.includes(p.token0.symbol) || stableCoins.includes(p.token1.symbol)
            }).map(p => {
                return {
                    createdAt: p.createdAtTimestamp,
                    liquidity: p.reserveUSD,
                    txCount: p.txCount,
                    volume: p.volumeUSD,
                    targetToken: stableCoins.includes(p.token0.symbol) ? `${p.token1.name} (${p.token1.symbol})` : `${p.token0.name} (${p.token0.symbol})`,
                    targetTokenAddress: stableCoins.includes(p.token0.symbol) ? p.token1.id : p.token0.id,
                    stableToken: stableCoins.includes(p.token0.symbol) ? `${p.token0.name} (${p.token0.symbol})` : `${p.token1.name} (${p.token1.symbol})`,
                    address: stableCoins.includes(p.token0.symbol) ? p.token1.id : p.token0.id 
                }

            })
            pairs.sort((a, b) => a.createdAt > b.createdAt ? -1 : 1)
            setNewPairs(pairs)
            setIsLoading(false)
          })
      }, [])


    const render = () => {
            
        return (
        <div className="content">
        <Row>
          <Col xs="12" className="d-flex justify-content-center">
            <AdBanner/>
          </Col>
        </Row>
        <div style={{ height: '1rem' }}>{/* spacer */}</div>
        <Row >
                <Card className="card-chart">
                    <CardHeader>
                        <Row>
                            <Col className="text-left" sm="6">
                                <CardTitle tag="h2">Welcome to the APE Directory{ isLoading ? <img src={loadingSpinner} width="40px" height="40px" style={{ marginLeft: '20px'}} />  : ''}</CardTitle>
                                <h5 style={{ color: 'red' }}>PROCEED AT YOUR OWN RISK: These tokens are not vetted in any way and it is very likely you will lose your money if you buy them.</h5>
                            </Col>
                        </Row>
                    </CardHeader>
                    <CardBody>
                        <div style={{ margin: '50px' }}>
                        <Row>
                        <Col >
                        <Table >
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Transactions</th>
                                    <th>Volume</th>
                                    <th>Liquidity</th>
                                    <th>Paired With</th>
                                    <th>Created At</th>
                                    <th></th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody >
                            {
                                newPairs.map(p => {
                                    return <tr>
                                        <td>{p.targetToken}</td>
                                        <td>{p.txCount}</td>
                                        <td>{formatter.format(p.volume)}</td>
                                        <td>{formatter.format(p.liquidity)}</td>
                                        <td>{p.stableToken}</td>
                                        <td>{new Date(p.createdAt * 1000).toISOString()}</td>
                                        <td><a target="_blank" rel="noreferrer" href={`https://explorer-mainnet.maticvigil.com/address/${p.address}/contracts`}>Contract</a></td>
                                        <td><a target="_blank" rel="noreferrer" href={`https://quickswap.exchange/#/swap?outputCurrency=${p.address}`}>Buy</a></td>
                                        <td>{ p.stableToken.includes('WMATIC') ? <a target="_blank" rel="noreferrer" href={`/token/${p.targetTokenAddress}`}>Chart</a> : '' }</td>
                                    </tr>
                                })
                            }
                            </tbody>
                        </Table>
                        </Col>
                        </Row>
                        </div>
                    </CardBody>
                </Card>
            </Row>
        </div>
        )

    }

    return render()

}

export default ApeTokens