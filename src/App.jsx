// App.jsx

import * as React from 'react';
import { extendTheme, styled } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { Suspense, useState, useEffect, useRef } from 'react';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import AccountDetail from './pages/AccountDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { useWebSocket } from './hooks/useWebSocket.jsx';
import WEB_SOCKET_URL from './config.jsx';
import TicketsPage from './pages/Tickets.jsx';
import CartTransfer from './pages/CartTransfer.jsx';
import TransferDetail from './pages/TransferDetail.jsx';
import SetProxy from './pages/SetProxy.jsx';
import logo from './assets/logo.svg';
import MoveDownIcon from '@mui/icons-material/MoveDown';
import Config from './pages/Config.jsx';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';

const demoTheme = extendTheme({
  colorSchemes: { light: true, dark: true },
  colorSchemeSelector: 'class',
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function useDemoRouter(initialPath) {
  const [pathname, setPathname] = React.useState(initialPath);

  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    };
  }, [pathname]);

  return router;
}

const Skeleton = styled('div')(({ theme, height }) => ({
  backgroundColor: theme.palette.action.hover,
  borderRadius: theme.shape.borderRadius,
  height,
  content: '" "',
}));

export default function App(props) {
  const { window } = props;
  const router = useDemoRouter('/dashboard');
  const demoWindow = window ? window() : undefined;

  const [accounts, setAccounts] = useState([]);
  const [navigation, setNavigation] = useState([
    { kind: 'header', title: 'Bot' },
    { segment: 'dashboard', title: 'Bot', icon: <DashboardIcon /> },
    { segment: 'tickets', title: 'Biletler', icon: <LocalActivityIcon /> },
    { segment: 'transfers', title: 'Sepet Transfer', icon: <MoveDownIcon /> },
    { segment: 'transfer_detail', title: 'Transfer Detay', icon: <MoveDownIcon /> },
    { segment: 'accounts', title: 'Hesaplar', children: [] },
    {
      kind: 'divider',
    },
    { segment: 'config', title: 'Ayarlar', icon: <SettingsIcon /> },
    {
      segment: 'tools',
      title: 'Araçlar',
      icon: <BuildIcon />,
      children: [
        {
          segment: 'set_proxy',
          title: 'Proxy Dönüştürücü',
        }
      ]
    },
  ]);

  const [botStatus, setBotStatus] = useState(null);
  const { messages, sendMessage } = useWebSocket(WEB_SOCKET_URL);
  const lastRefreshTime = useRef(0); // Initialize to 0 instead of Date.now()

  // Handle refresh_user request with cooldown
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime.current;
        
        if (timeSinceLastRefresh >= 10000 && sendMessage) {
          sendMessage({ action: 'refresh_user' });
          lastRefreshTime.current = now;
        }
      }
    }

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Send initial refresh_user on mount
    if (sendMessage) {
      sendMessage({ action: 'refresh_user' });
      lastRefreshTime.current = Date.now();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendMessage]);

  useEffect(() => {
    if (sendMessage) {
      sendMessage({ action: 'accounts' });
    }

    const interval = setInterval(() => {
      if (sendMessage) {
        sendMessage({ action: 'accounts' });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sendMessage]);

  useEffect(() => {
    if (messages.length > 0) {
      messages.forEach((message) => {
        if (message.action === 'bot_status') {
          setBotStatus(message.result);
        }

        if (message.action === 'accounts' && !message.isError) {
          const newAccounts = message.result.accounts.map((account, index) => {
            const segment = account.mbl?.device_id || `account-${index}`;
            
            return {
              segment,
              title: `${index + 1} - ${account.username}`,
              email: account.username,
              accountData: {
                username: account.username,
                is_web: account.is_web,
                is_mbl: account.is_mbl,
                mbl: account.mbl,
                web: account.web
              }
            };
          });

          setAccounts(newAccounts);

          setNavigation((prevNavigation) => {
            return prevNavigation.map((navItem) => {
              if (navItem.segment === 'accounts') {
                return { ...navItem, children: newAccounts };
              }
              return navItem;
            });
          });
        }
      });
    }
  }, [messages]);

  const getPageContent = () => {
    const segments = router.pathname.split('/');
    const segment = segments[1];

    if (segment === 'dashboard') {
      return <Dashboard messages={messages} sendMessage={sendMessage} />;
    }

    if (segment === 'accounts') {
      const accountSegment = segments[2];
      const account = accounts.find((acc) => acc.segment === accountSegment);
      if (account) {
        return <AccountDetail 
          email={account.email} 
          accountData={account.accountData}
        />;
      }
    }

    if (segment === 'tickets') {
      return <TicketsPage messages={messages} sendMessage={sendMessage} />;
    }

    if (segment === 'transfers') {
      return <CartTransfer messages={messages} sendMessage={sendMessage} />;
    }

    if (segment === 'transfer_detail') {
      return <TransferDetail messages={messages} sendMessage={sendMessage} />;
    }

    if (segment === 'config') {
      return <Config messages={messages} sendMessage={sendMessage} />;
    }

    if (segment === 'tools') {
      const subSegment = segments[2];
      if (subSegment === 'set_proxy') {
        return <SetProxy messages={messages} sendMessage={sendMessage} />;
      }
    }

    return <p>Sayfa Bulunamadı</p>;
  };

  return (
    <AppProvider
      navigation={navigation}
      router={router}
      theme={demoTheme}
      window={demoWindow}
      branding={{
        logo: (
          <img
            src={logo}
            alt="Bayer Ticket logo"
          />
        ),
        title: (
          <span style={{ color: '#f2d588' }}></span>
        ),
        homeUrl: '/',
      }}
    >
      <DashboardLayout>
        <Suspense fallback={<div>Loading...</div>}>
          {getPageContent()}
        </Suspense>
      </DashboardLayout>
    </AppProvider>
  );
}
