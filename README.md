# @wharfkit/wallet-plugin-paycash

A Session Kit wallet plugin for the PayCash wallet.

## Описание

Этот плагин позволяет использовать кошелек PayCash для аутентификации и подписания транзакций в экосистеме WharfKit (Antelope/EOS и др.).

Плагин реализует авторизацию через QR-код, аналогично тому, как это реализовано на сайте [pc4.store/login](https://pc4.store/login).

## Установка

```
npm install @wharfkit/wallet-plugin-paycash
```

## Использование

```js
import {WalletPluginPayCash} from '@wharfkit/wallet-plugin-paycash';
import {SessionKit} from '@wharfkit/session';

const kit = new SessionKit({
  // ... ваши опции
  walletPlugins: [new WalletPluginPayCash()],
});
```

## Статус

Плагин находится в разработке. Реализация методов подключения и подписи будет добавлена после изучения API PayCash.

## Лицензия

MIT