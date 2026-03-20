/**
 * This package contains utilities for converting from Web3.js classes to the data
 * structures in Kit. Adopted from
 * [`@solana/compat`](https://github.com/anza-xyz/kit/tree/main/packages/compat).
 *
 * @packageDocumentation
 */
import type {Rpc, RpcApi, RpcTransport} from '@solana/rpc';
import {createJsonRpcApi, createRpc} from '@solana/rpc';
import type {HttpHeaders} from '../connection';

export * from './address';
export * from './instruction';
export * from './keypair';
export * from './transaction';

type RpcCompatibleConnection = Readonly<{
	rpcEndpoint: string;
	rpcHttpHeaders?: HttpHeaders;
}>;

/**
 * Non-exported type/interface from [@solana/rpc-spec](https://github.com/anza-xyz/kit/blob/10793f5a2f3608fe3c68a0ad835a08e04c8e8579/packages/rpc-spec/src/rpc-api.ts#L73-L76)
 */
type RpcApiMethod = (...args: any) => any;
interface RpcApiMethods {
    [methodName: string]: RpcApiMethod;
}

const defaultFetch: typeof globalThis.fetch = (input, init) => {
	if (typeof globalThis.fetch !== 'function') {
		throw new Error('globalThis.fetch is not available in this environment');
	}
	const processedInput =
		typeof input === 'string' && input.slice(0, 2) === '//'
			? `https:${input}`
			: input;
	return globalThis.fetch(processedInput, init);
};

function createRpcTransport(
	url: string,
	httpHeaders?: HttpHeaders,
): RpcTransport {
	return async ({payload, signal}) => {
		const response = await defaultFetch(url, {
			body: JSON.stringify(payload),
			headers: Object.assign(
				{
					'Content-Type': 'application/json',
				},
				httpHeaders ?? {},
			),
			method: 'POST',
			signal,
		});

		const text = await response.text();
		if (!response.ok) {
			throw new Error(`${response.status} ${response.statusText}: ${text}`);
		}

		return text ? JSON.parse(text) : null;
	};
}

/**
 * Creates a Kit RPC client from a Web3.js connection using its HTTP JSON-RPC transport.
 */
export function toKitRpcClient<TRpcMethods extends RpcApiMethods = RpcApiMethods>(
	connection: RpcCompatibleConnection,
	api?: RpcApi<TRpcMethods>,
): Rpc<TRpcMethods> {
	return createRpc({
		api: api ?? createJsonRpcApi(),
		transport: createRpcTransport(
			connection.rpcEndpoint,
			connection.rpcHttpHeaders,
		),
	});
}
