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
    new WalletPluginPayCash(), // PayCash wallet plugin
  ],
  ui: webRenderer,
});

// Popular tokens for EOS Mainnet (can be extended)
// const TOKENS = [
//   {contract: 'eosio.token', symbol: 'EOS'},
//   // {contract: 'tethertether', symbol: 'USDT'}, // example for other tokens
// ];

// Get balances for all tokens
async function fetchBalances(session: { permissionLevel: { actor: { toString: () => string } } }): Promise<Array<{symbol: string, contract: string, amount: string}>> {
  const account = session.permissionLevel.actor.toString();
  const balances: Array<{symbol: string, contract: string, amount: string}> = [];

  try {
    // Create client directly (as in test function)
    const { APIClient } = await import('@wharfkit/antelope');
    const { FetchProvider } = await import('@wharfkit/antelope');
    
    const client = new APIClient({ 
      provider: new FetchProvider('https://eos.greymass.com') 
    });
    
    console.log('Fetching balances for account:', account);
    
    // Get all balances from eosio.token
    const eosioResult = await client.v1.chain.get_currency_balance('eosio.token', account);
    console.log('eosio.token balances:', eosioResult);
    for (const entry of eosioResult) {
      const [amount, symbol] = entry.toString().split(' ');
      if (parseFloat(amount) > 0) {
        balances.push({symbol, contract: 'eosio.token', amount});
      }
    }
    
    // Get all balances from tethertether
    const tetherResult = await client.v1.chain.get_currency_balance('tethertether', account);
    console.log('tethertether balances:', tetherResult);
    for (const entry of tetherResult) {
      const [amount, symbol] = entry.toString().split(' ');
      if (parseFloat(amount) > 0) {
        balances.push({symbol, contract: 'tethertether', amount});
      }
    }
    
    // Get all balances from token.defi
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

// Render balances and form
function renderBalancesAndForm(account: string, balances: Array<{symbol: string, contract: string, amount: string}>, session: unknown) {
  const root = document.getElementById('wallet-list');
  if (!root) return;
  let html = `<h3>Account balance for <b>${account}</b>:</h3>`;
  if (balances.length === 0) {
    html += '<div>No tokens with balance > 0</div>';
  } else {
    html += '<ul>' + balances.map(b => `<li><b>${b.amount} ${b.symbol}</b> (contract: ${b.contract})</li>`).join('') + '</ul>';
  }
  // EOS transfer form
  html += `
    <h3>Send EOS</h3>
    <form id="send-eos-form">
      <label>To (account): <input name="to" required></label><br>
      <label>Amount (EOS): <input name="amount" type="number" step="0.0001" min="0.0001" required></label><br>
      <button type="submit">Send</button>
    </form>
    <div id="tx-result"></div>
  `;
  root.innerHTML = html;
  // Form handler
  const form = document.getElementById('send-eos-form') as HTMLFormElement;
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const to = (form.elements.namedItem('to') as HTMLInputElement).value.trim();
      const amount = (form.elements.namedItem('amount') as HTMLInputElement).value.trim();
      const resultDiv = document.getElementById('tx-result');
      resultDiv!.textContent = 'Sending...';
      try {
        const action = {
          account: 'eosio.token',
          name: 'transfer',
          authorization: [(session as { permissionLevel: unknown }).permissionLevel],
          data: {
            from: account,
            to,
            quantity: `${parseFloat(amount).toFixed(4)} EOS`,
            memo: '',
          },
        };
        const res = await (session as { transact: (options: unknown, config?: unknown) => Promise<unknown> }).transact({actions: [action]}, {broadcast: true});
        const txid = (res as { transaction_id?: string, transaction?: { id?: string } }).transaction_id || ((res as { transaction?: { id?: string } }).transaction && (res as { transaction?: { id?: string } }).transaction?.id) || JSON.stringify(res);
        resultDiv!.textContent = 'Transaction sent! ID: ' + txid;
      } catch (err: unknown) {
        resultDiv!.textContent = 'Error: ' + ((err as Error).message || err);
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
    renderBalancesAndForm(account, balances, session as { permissionLevel: { actor: { toString: () => string } }, transact: (options: unknown) => Promise<unknown> });
  } catch (e) {
    console.error(e);
  }
}); 

// Test function to get balances without authorization
async function testBalances() {
  try {
    // Create client for EOS mainnet
    const { APIClient } = await import('@wharfkit/antelope');
    const { FetchProvider } = await import('@wharfkit/antelope');
    
    const client = new APIClient({ 
      provider: new FetchProvider('https://eos.greymass.com') 
    });
    
    console.log('Testing balances for eosio...');
    
    // Get all balances from eosio.token
    const eosioResult = await client.v1.chain.get_currency_balance('eosio.token', 'eosio');
    console.log('eosio.token balances:', eosioResult);
    
    // Get all balances from tethertether
    const tetherResult = await client.v1.chain.get_currency_balance('tethertether', 'eosio');
    console.log('tethertether balances:', tetherResult);
    
    // Get all balances from token.defi
    const defiResult = await client.v1.chain.get_currency_balance('token.defi', 'eosio');
    console.log('token.defi balances:', defiResult);
    
    // Display result on page
    const testDiv = document.getElementById('wallet-list');
    if (testDiv) {
      let html = '<h3>Test balances for eosio:</h3>';
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
        testDiv.innerHTML = '<h3>Error getting balances:</h3><pre>' + e + '</pre>';
      }
    }
}

// Call test when page loads
testBalances(); 