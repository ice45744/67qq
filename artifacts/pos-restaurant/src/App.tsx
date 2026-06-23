import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/Layout";

import Home from "@/pages/Home";
import Orders from "@/pages/Orders";
import MenuAdmin from "@/pages/Menu";
import Settings from "@/pages/Settings";
import Kitchen from "@/pages/Kitchen";
import CustomerOrder from "@/pages/CustomerOrder";

function Router() {
  return (
    <Switch>
      <Route path="/kitchen" component={Kitchen} />
      <Route path="/order" component={CustomerOrder} />
      <Route>
        <Layout>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/orders" component={Orders} />
            <Route path="/menu" component={MenuAdmin} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
