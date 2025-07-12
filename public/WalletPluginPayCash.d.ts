import { AbstractWalletPlugin, Checksum256, LoginContext, PermissionLevel, PublicKey, ResolvedSigningRequest, TransactContext, WalletPluginConfig, WalletPluginLoginResponse, WalletPluginMetadata, WalletPluginSignResponse } from '@wharfkit/session';
export declare class WalletPluginPayCash extends AbstractWalletPlugin {
    chain: Checksum256 | undefined;
    auth: PermissionLevel | undefined;
    requestKey: PublicKey | undefined;
    privateKey: any;
    signerKey: PublicKey | undefined;
    channelUrl: string | undefined;
    channelName: string | undefined;
    buoyUrl: string;
    id: string;
    constructor(options?: {
        buoyUrl?: string;
    });
    readonly config: WalletPluginConfig;
    readonly metadata: WalletPluginMetadata;
    login(context: LoginContext): Promise<WalletPluginLoginResponse>;
    sign(resolved: ResolvedSigningRequest, context: TransactContext): Promise<WalletPluginSignResponse>;
}
