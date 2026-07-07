import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Layout } from '@/components/layout';
import Landing from '@/pages/landing';
import Onboard from '@/pages/onboard';
import Dashboard from '@/pages/dashboard';
import Play from '@/pages/play';
import Game from '@/pages/game';
import Leaderboard from '@/pages/leaderboard';
import Profile from '@/pages/profile';
import Replay from '@/pages/replay';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/onboard" component={Onboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/play" component={Play} />
        <Route path="/game/:id" component={Game} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/profile/:address" component={Profile} />
        <Route path="/replay/:id" component={Replay} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
