// Заглушка для WalletPluginPayCash
export class WalletPluginPayCash {
  constructor(options?: any) {
    // TODO: инициализация опций
  }

  getMetadata() {
    return {
      name: 'PayCash',
      description: 'PayCash wallet plugin for WharfKit SessionKit',
      // другие метаданные
    };
  }

  async connect() {
    // TODO: логика подключения через QR-код
    return {status: 'pending'};
  }

  async sign() {
    // TODO: логика подписи транзакций
    return {status: 'not_implemented'};
  }
}

export default WalletPluginPayCash; 