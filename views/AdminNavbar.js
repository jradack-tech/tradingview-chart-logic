import { useState, useEffect } from "react";
import { numberWithCommas } from "../../util/Helpers"
// nodejs library that concatenates classes
import classNames from "classnames";
import { useAccount } from "../../contexts/AccountProvider"

// reactstrap components
import {
  Button,
  Collapse,
  Navbar,
  Nav,
  Col,
  Container,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  NavbarToggler,
  Row
} from "reactstrap";
import TokenSearch from "../../components/TokenSearch/TokenSearch"
import logo from "../../assets/img/logo.png";
import loading from "../../assets/img/loading.gif";
import metamask from "../../assets/img/metamask.png";
import trustwallet from "../../assets/img/trustwallet.png";
import telegram from "../../assets/img/telegram.png";
import twitter from "../../assets/img/twitter.png";

const {
  REACT_APP_API_DOMAIN,
} = process.env

function AdminNavbar(props) {
  const { connectWallet, wallet, disconnectWallet, quickChartBalance, quickChartPrice, accountIsLoading, quickChartMaticLPValue, getAccountData } = useAccount()
  const [collapseOpen, setcollapseOpen] = useState(false);
  const [color, setcolor] = useState("navbar-transparent");
  const [modalIsOpen, setModalIsOpen] = useState(false)

  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  useEffect(() => {
    window.addEventListener("resize", updateColor);
    // Specify how to clean up after this effect:
    return function cleanup() {
      window.removeEventListener("resize", updateColor);
    };
  });

  // function that adds color white/transparent to the navbar on resize (this is for the collapse)
  const updateColor = () => {
    if (window.innerWidth < 993 && collapseOpen) {
      setcolor("bg-white");
    } else {
      setcolor("navbar-transparent");
    }
  };

  // this function opens and closes the collapse on small devices
  const toggleCollapse = () => {
    if (collapseOpen) {
      setcolor("navbar-transparent");
    } else {
      setcolor("bg-white");
    }
    setcollapseOpen(!collapseOpen);
  };

  // TODO
  let onTokenSelected = props.onTokenSelected
  if (!onTokenSelected) {
    onTokenSelected = (tokenInfo) => {
      window.location.href=`/token/${tokenInfo.address}`
    }
  }

  return (
    <>
      <Navbar className={classNames("navbar-absolute", color)} expand="xl">
        <Container fluid>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a href="/">
              <img src={logo} alt="Quick Chart" style={{ height: '50px', width: '50px', marginRight: '1rem', maxWidth: 'unset' }} />
            </a>
            <a href="/" style={{ fontSize: '1.25rem', whiteSpace: 'nowrap' }}>
              Quick Chart
            </a>
            <a href="https://t.me/QuickChart" target="_blank" rel="noreferrer">
              <img src={telegram} alt="QuickChart Telegram" width="25px" height="25px" style={{ margin: "10px" }}></img>
            </a>
            <a href="https://twitter.com/quick_chart" target="_blank" rel="noreferrer">
              <img src={twitter} alt="QuickChart Twitter" width="25px" height="25px" style={{ margin: "10px" }}></img>
            </a>
          </div>
          <div style={{ color: 'white', whiteSpace: 'nowrap', marginLeft: '1rem'}}>
            {wallet.account ? (
               accountIsLoading ? <img src={loading} width="40px" height="40px" style={{ marginTop: '10px', marginRight: '120px'}} /> :
                <Row>
                  <Col xs="9">
                    <div>
                      QuickChart Balance: {numberWithCommas(quickChartBalance.toFixed(2))} ({formatter.format(quickChartBalance * quickChartPrice)})
                    </div>
                    <div>
                      QuickChart/MATIC LP Value: {formatter.format(quickChartMaticLPValue)}
                    </div>
                  </Col>
                  <Col xs="3">
                    <Button size="sm" onClick={() => getAccountData(true)}>
                      <i className="tim-icons icon-refresh-02" />
                    </Button>
                  </Col>
                </Row>
            ) : ''}
          </div>
          <NavbarToggler onClick={toggleCollapse}>
            <span className="navbar-toggler-bar navbar-kebab" />
            <span className="navbar-toggler-bar navbar-kebab" />
            <span className="navbar-toggler-bar navbar-kebab" />
          </NavbarToggler>
          <Collapse navbar isOpen={collapseOpen}>
            <Nav navbar className="ml-auto">
              <div style={{ display: 'flex', marginRight: '125px' }}>
              <TokenSearch onTokenSelected={onTokenSelected} />
              </div>
              <div>
                {wallet.status === 'connected' && wallet.account ? (
                  <Button onClick={() => disconnectWallet()}>{wallet.account.substr(0, 6) + '...' + wallet.account.substr(38, 6)}</Button>
                ) : (
                  <Button onClick={() => setModalIsOpen(true)}>Connect</Button>
                )}
              </div>
            </Nav>
          </Collapse>
        </Container>
      </Navbar>
      <Modal isOpen={modalIsOpen}>
        <ModalHeader >Connect Your Wallet:</ModalHeader>
        <ModalBody>
          <Row>
            <Button onClick={() => { connectWallet(); setModalIsOpen(false) }}>
              <img alt="MetaMask" width='25px' height='25px' src={metamask} style={{ marginRight: '5px'}}/>MetaMask
            </Button>
          </Row>
          <Row>
            <Button onClick={() => { connectWallet(); setModalIsOpen(false) }}>
              <img alt="TrustWallet" width='25px' height='25px' src={trustwallet} style={{ marginRight: '5px'}}/>TrustWallet
            </Button>
          </Row>
        </ModalBody>
        <hr />
        <ModalFooter>
          <Button style={{ margin: 'auto', marginBottom: '10px', float: 'right' }} color="danger" onClick={() => { setModalIsOpen(false) }}>Cancel</Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

export default AdminNavbar;
