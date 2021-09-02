import {
    useParams,
    useLocation
} from "react-router-dom";
import { useState, useEffect } from 'react';
import { getFactoryContract, getPairContract, getTokenInfo, STABLE_PAIRS } from "../util/Helpers"
import TokenChart from "../components/TokenChart/TokenChart"
import AdBanner from "../components/AdBanner"
import { useAccount } from "../contexts/AccountProvider"

// reactstrap components
import {
  Row,
  Col,
} from "reactstrap";

const {
  REACT_APP_STABLE_TOKEN_ADDRESS,
  REACT_APP_POLYZAP_FACTORY_ADDRESS,
  REACT_APP_POLYZAP_ROUTER_ADDRESS,
  REACT_APP_ROUTER_ADDRESS,
  REACT_APP_FACTORY_ADDRESS,
  REACT_APP_DFYN_FACTORY_ADDRESS,
  REACT_APP_DFYN_ROUTER_ADDRESS,
  REACT_APP_DFYN_MATIC_ADDRESS
 } = process.env

// A custom hook that builds on useLocation to parse
// the query string for you.
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Token = () => {
    const { notify } = useAccount()
    const { tokenAddress } = useParams()
    const [interval] = useState('5m')
    const [pairInfo, setPairInfo] = useState(null)
    const [routerAddress, setRouterAddress] = useState(null)
    const query = useQuery();
    const [exchange] = useState(query.get('exchange') || 'QuickSwap')
    var stableName = query.get('pairedWith') || 'wmatic'
    if(tokenAddress.toLowerCase() === REACT_APP_STABLE_TOKEN_ADDRESS.toLowerCase() && stableName.toLowerCase() === 'wmatic') {
      stableName = 'WETH'
    }

    const loadData = async () => {
      try{

        const nextStableTokenInfo = STABLE_PAIRS[stableName.toUpperCase()] || STABLE_PAIRS['WMATIC']

        var pairCache = window.localStorage.getItem('pair-cache')
        pairCache = pairCache ? JSON.parse(pairCache) : {}
        var factory
        if (exchange === 'PolyZap') {
          factory = await getFactoryContract(REACT_APP_POLYZAP_FACTORY_ADDRESS)
          setRouterAddress(REACT_APP_POLYZAP_ROUTER_ADDRESS)
        } else if (exchange === 'DFYN') {
          factory = await getFactoryContract(REACT_APP_DFYN_FACTORY_ADDRESS)
          setRouterAddress(REACT_APP_DFYN_ROUTER_ADDRESS)
        }  else {
          factory = await getFactoryContract(REACT_APP_FACTORY_ADDRESS)
          setRouterAddress(REACT_APP_ROUTER_ADDRESS)
        }
        
        const nextPairAddress = (await factory.methods.getPair(tokenAddress, exchange === 'DFYN' && stableName.toUpperCase() === 'WMATIC' ? REACT_APP_DFYN_MATIC_ADDRESS : nextStableTokenInfo.address).call()).toLowerCase()
        const isTargetStable = Object.keys(STABLE_PAIRS).some(stableName => STABLE_PAIRS[stableName.toUpperCase()].address.toLowerCase() === tokenAddress.toLowerCase())

        var  nextTokenInfo, newPairInfo
        if(!isTargetStable && pairCache && pairCache[nextPairAddress.toLowerCase()]) {
          console.log('Pair found in cache')
          newPairInfo = pairCache[nextPairAddress.toLowerCase()]
          nextTokenInfo = newPairInfo.targetToken
        } else {
          console.log('Pair not found in cache')
          var tokenCache = window.localStorage.getItem('token-cache')
          tokenCache = tokenCache ? JSON.parse(tokenCache) : {}
          
          if(tokenCache[tokenAddress.toLowerCase()]) {
            console.log('Target found in cache')
            nextTokenInfo = tokenCache[tokenAddress.toLowerCase()]
          } else {
            console.log('Target not found in cache')
            nextTokenInfo = await getTokenInfo(tokenAddress.toLowerCase())
            tokenCache[tokenAddress.toLowerCase()] = nextTokenInfo
          }

          window.localStorage.setItem('token-cache', JSON.stringify(tokenCache))

          const pairContract = await getPairContract(nextPairAddress)
          const token0Address = (await pairContract.methods.token0().call()).toLowerCase()
          newPairInfo = {
            address: nextPairAddress,
            stableToken: nextStableTokenInfo,
            targetToken: nextTokenInfo,
            isTarget0: token0Address === nextTokenInfo.address.toLowerCase()
          }
          
          if(!isTargetStable) {
            pairCache[nextPairAddress] = newPairInfo
            window.localStorage.setItem('pair-cache', JSON.stringify(pairCache))
          }
        }

        newPairInfo.stableToken = nextStableTokenInfo
        setPairInfo(newPairInfo)

      } catch(e) {
        notify({
          place: 'tc',
          message: (
            <div>
              <div>
                <b>QuickChart was unable to find a {stableName.toUpperCase()} pair for this token on the {exchange || 'QuickSwap'} exchange.</b>
              </div>
            </div>
          ),
          type: 'danger',
          icon: "tim-icons icon-bell-55",
        })
        console.log(e.stack)
      }
    }

  useEffect(() => {
    loadData()
  }, [])


  const render = () => {
    return  (
      <div className="content">
        <Row>
          <Col xs="12" className="d-flex justify-content-center">
            <AdBanner/>
          </Col>
        </Row>
        <div style={{ height: '1rem' }}>{/* spacer */}</div>
        <Row>
          <Col xs="12">
            {pairInfo && routerAddress && exchange && interval ? (
              <TokenChart
                pairInfo={pairInfo}
                interval={interval}
                routerAddress={routerAddress}
                exchange={exchange}
              /> ) : null}
          </Col>
        </Row>
      </div>
    )
  }

  return render()
}

export default Token
