import { createBrowserRouter } from "react-router";
import { IntroScreen } from "./components/IntroScreen";
import { BillingScreen } from "./components/BillingScreen";
import { SellerDashboard } from "./components/SellerDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: IntroScreen,
  },
  {
    path: "/billing",
    Component: BillingScreen,
  },
  {
    path: "/dashboard",
    Component: SellerDashboard,
  },
]);
