import AutoLaunch from 'auto-launch';
import { app } from 'electron'; // tslint:disable-line no-implicit-dependencies
import settings from 'electron-settings';
import { autoUpdater } from 'electron-updater';
import Connection from './connection';
import MenuUI from './menu-ui';
import Netlify from './netlify';

const OAUTH_CLIENT_ID =
  '95d3a5f15e46699275056966ec5467073e27cfe13ab1dd29deb5825a483f3d44';

/**
 *
 *
 * @param {JsonValue} accessToken
 * @returns {Promise<{ accessToken: JsonValue }>}
 */
const getNetlifyClient = async (accessToken: string): Promise<Netlify> => {
  const apiClient = new Netlify(accessToken);
  await apiClient.authorize(OAUTH_CLIENT_ID);
  return apiClient;
};

const getOnlineConnection = (): Promise<Connection> => {
  return new Promise(resolve => {
    const connection = new Connection();

    connection.on('status-changed', conn => {
      if (conn.isOnline) {
        resolve(connection);
      }
    });
  });
};

/**
 *
 *
 * @returns {Promise<void>}
 */
const onAppReady = async (): Promise<void> => {
  const connection = await getOnlineConnection();

  const apiClient = await getNetlifyClient(settings.get(
    'accessToken'
  ) as string);
  settings.set('accessToken', apiClient.accessToken);

  const autoLauncher = new AutoLaunch({
    name: 'Netlify Menubar',
    path: '/Applications/Netlify Menubar.app'
  });

  if (settings.get('launchAtStart')) {
    autoLauncher.enable();
  } else {
    autoLauncher.disable();
  }

  const ui = new MenuUI({
    apiClient,
    autoLauncher,
    connection
  });

  // only hide dock icon when everything's running
  // otherwise the auth prompt disappears in MacOS
  app.dock.hide();

  autoUpdater.checkForUpdatesAndNotify();
};

export const start = () => {
  app.on('ready', onAppReady);
};
