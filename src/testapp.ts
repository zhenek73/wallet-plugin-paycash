import {SessionKit} from '@wharfkit/session';
import {WebRenderer} from '@wharfkit/web-renderer';
import {WalletPluginAnchor} from '@wharfkit/wallet-plugin-anchor';
import {WalletPluginScatter} from '@wharfkit/wallet-plugin-scatter';
import {WalletPluginWombat} from '@wharfkit/wallet-plugin-wombat';
import {WalletPluginPayCash} from './WalletPluginPayCash';

const webRenderer = new WebRenderer();

const kit = new SessionKit({
  appName: 'PayCash Wallet Plugin Test',
  chains: [
    {
      //id: '73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d',
      //url: 'https://jungle4.greymass.com',
      
      id: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
      url: 'https://eos.greymass.com',
    },
  ],
  walletPlugins: [
    new WalletPluginAnchor(),
    new WalletPluginScatter(),
    new WalletPluginWombat(),
    new WalletPluginPayCash(), // Новый форк PayCash
  ],
  ui: webRenderer,
});

// Популярные токены для Jungle4 (можно расширить)
const TOKENS = [
  {contract: 'eosio.token', symbol: 'EOS'},
  // {contract: 'tethertether', symbol: 'USDT'}, // пример для других токенов
];

// Получить балансы всех токенов
async function fetchBalances(session: any): Promise<Array<{symbol: string, contract: string, amount: string}>> {
  const account = session.permissionLevel.actor.toString();
  const balances: Array<{symbol: string, contract: string, amount: string}> = [];

  try {
    // Создаём клиент напрямую (как в тестовой функции)
    const { APIClient } = await import('@wharfkit/antelope');
    const { FetchProvider } = await import('@wharfkit/antelope');
    
    const client = new APIClient({ 
      provider: new FetchProvider('https://eos.greymass.com') 
    });
    
    console.log('Fetching balances for account:', account);
    
    // Получаем все балансы с eosio.token
    const eosioResult = await client.v1.chain.get_currency_balance('eosio.token', account);
    console.log('eosio.token balances:', eosioResult);
    for (const entry of eosioResult) {
      const [amount, symbol] = entry.toString().split(' ');
      if (parseFloat(amount) > 0) {
        balances.push({symbol, contract: 'eosio.token', amount});
      }
    }
    
    // Получаем все балансы с tethertether
    const tetherResult = await client.v1.chain.get_currency_balance('tethertether', account);
    console.log('tethertether balances:', tetherResult);
    for (const entry of tetherResult) {
      const [amount, symbol] = entry.toString().split(' ');
      if (parseFloat(amount) > 0) {
        balances.push({symbol, contract: 'tethertether', amount});
      }
    }
    
    // Получаем все балансы с token.defi
    const defiResult = await client.v1.chain.get_currency_balance('token.defi', account);
    console.log('token.defi balances:', defiResult);
    for (const entry of defiResult) {
      const [amount, symbol] = entry.toString().split(' ');
      if (parseFloat(amount) > 0) {
        balances.push({symbol, contract: 'token.defi', amount});
      }
    }
    
  } catch (e) {
    console.error('Error fetching balances:', e);
  }

  console.log('Final balances:', balances);
  return balances;
}

// Рендер балансы и форму
function renderBalancesAndForm(account: string, balances: Array<{symbol: string, contract: string, amount: string}>, session: any) {
  const root = document.getElementById('wallet-list');
  if (!root) return;
  let html = `<h3>Баланс аккаунта <b>${account}</b>:</h3>`;
  if (balances.length === 0) {
    html += '<div>Нет токенов с балансом > 0</div>';
  } else {
    html += '<ul>' + balances.map(b => `<li><b>${b.amount} ${b.symbol}</b> (контракт: ${b.contract})</li>`).join('') + '</ul>';
  }
  // Форма отправки EOS
  html += `
    <h3>Отправить EOS</h3>
    <form id="send-eos-form">
      <label>Кому (аккаунт): <input name="to" required></label><br>
      <label>Сколько (EOS): <input name="amount" type="number" step="0.0001" min="0.0001" required></label><br>
      <button type="submit">Отправить</button>
    </form>
    <div id="tx-result"></div>
  `;
  root.innerHTML = html;
  // Обработчик формы
  const form = document.getElementById('send-eos-form') as HTMLFormElement;
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const to = (form.elements.namedItem('to') as HTMLInputElement).value.trim();
      const amount = (form.elements.namedItem('amount') as HTMLInputElement).value.trim();
      const resultDiv = document.getElementById('tx-result');
      resultDiv!.textContent = 'Отправка...';
      try {
        const action = {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [session.permissionLevel],
          data: {
            from: account,
            to,
            quantity: `${parseFloat(amount).toFixed(4)} EOS`,
            memo: '',
          },
        };
        const res = await session.transact({actions: [action]}, {broadcast: true});
        let txid = res.transaction_id || (res.transaction && res.transaction.id) || JSON.stringify(res);
        resultDiv!.textContent = 'Транзакция отправлена! ID: ' + txid;
      } catch (err: any) {
        resultDiv!.textContent = 'Ошибка: ' + (err.message || err);
      }
    };
  }
}

document.getElementById('connect-wallet')?.addEventListener('click', async () => {
  try {
    const loginResult = await kit.login();
    const session = loginResult.session;
    if (!session) return;
    const account = session.permissionLevel.actor.toString();
    const balances = await fetchBalances(session);
    renderBalancesAndForm(account, balances, session);
  } catch (e) {
    console.error(e);
  }
}); 

// Тестовая функция для получения балансов без авторизации
async function testBalances() {
  try {
    // Создаём клиент для основной сети EOS
    const { APIClient } = await import('@wharfkit/antelope');
    const { FetchProvider } = await import('@wharfkit/antelope');
    
    const client = new APIClient({ 
      provider: new FetchProvider('https://eos.greymass.com') 
    });
    
    console.log('Testing balances for cryptozhenek...');
    
    // Получаем все балансы с eosio.token
    const eosioResult = await client.v1.chain.get_currency_balance('eosio.token', 'cryptozhenek');
    console.log('eosio.token balances:', eosioResult);
    
    // Получаем все балансы с tethertether
    const tetherResult = await client.v1.chain.get_currency_balance('tethertether', 'cryptozhenek');
    console.log('tethertether balances:', tetherResult);
    
    // Получаем все балансы с token.defi
    const defiResult = await client.v1.chain.get_currency_balance('token.defi', 'cryptozhenek');
    console.log('token.defi balances:', defiResult);
    
    // Выводим результат на страницу
    const testDiv = document.getElementById('wallet-list');
    if (testDiv) {
      let html = '<h3>Тест балансов cryptozhenek:</h3>';
      html += '<h4>eosio.token:</h4><ul>';
      eosioResult.forEach(balance => {
        html += `<li>${balance}</li>`;
      });
      html += '</ul>';
      
      html += '<h4>tethertether:</h4><ul>';
      tetherResult.forEach(balance => {
        html += `<li>${balance}</li>`;
      });
      html += '</ul>';
      
      html += '<h4>token.defi:</h4><ul>';
      defiResult.forEach(balance => {
        html += `<li>${balance}</li>`;
      });
      html += '</ul>';
      
      testDiv.innerHTML = html;
    }
    
  } catch (e) {
    console.error('Error testing balances:', e);
    const testDiv = document.getElementById('wallet-list');
    if (testDiv) {
      testDiv.innerHTML = '<h3>Ошибка при получении балансов:</h3><pre>' + e + '</pre>';
    }
  }
}

// Вызываем тест при загрузке страницы
testBalances(); 