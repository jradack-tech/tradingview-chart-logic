/*!

=========================================================
* Black Dashboard React v1.2.0
=========================================================

* Product Page: https://www.creative-tim.com/product/black-dashboard-react
* Copyright 2020 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/black-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import Dashboard from "./views/Dashboard.js";
import Portfolio from "./views/Portfolio.js";
import Promote from "./views/Promote.js"
import Token from "./views/Token.js";
import Information from "./views/Information.js";
import ApeTokens from "./views/ApeTokens.js";


var routes = [
  {
    path: "/",
    name: "Dashboard",
    rtlName: "",
    icon: "tim-icons icon-chart-pie-36",
    component: Dashboard,
    layout: "/",
  },
  {
    path: "token/:tokenAddress",
    name: "Token Chart",
    rtlName: "",
    icon: "tim-icons icon-atom",
    component: Token,
    layout: "/",
  },
  {
    path: "portfolio",
    name: "My Portfolio",
    rtlName: "",
    icon: "tim-icons icon-atom",
    component: Portfolio,
    layout: "/",
  },
  {
    path: "promote",
    name: "Promote",
    rtlName: "",
    icon: "tim-icons icon-atom",
    component: Promote,
    layout: "/",
  },
  {
    path: "frequently-asked",
    name: "Frequently Asked Question",
    rtlName: "",
    icon: "tim-icons icon-atom",
    component: Information,
    layout: "/",
  },
  {
    path: "ape",
    name: "New Listings",
    rtlName: "",
    icon: "tim-icons icon-atom",
    component: ApeTokens,
    layout: "/",
  },
];
export default routes;
