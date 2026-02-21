# Learned 

## Team members

<table>
	<tbody>
        <tr>
            <td align="center">
                <a href="https://github.com/gongahkia">
                    <img src="https://avatars.githubusercontent.com/u/117062305?v=4" width="100;" alt="gongahkia"/>
                    <br />
                    <sub><b>Gabriel Ong</b></sub>
                </a>
                <br />
            </td>
            <td align="center">
                <a href="https://github.com/kopicplusplus">
                    <img src="https://avatars.githubusercontent.com/u/206502697?v=4" width="100;" alt=""/>
                    <br />
                    <sub><b>Keith Tang</b></sub>
                </a>
                <br />
            </td>
            <td align="center">
                <a href="https://github.com/a-stint">
                    <img src="https://avatars.githubusercontent.com/u/107232374?v=4" width="100;" alt=""/>
                    <br />
                    <sub><b>Astin Tay</b></sub>
                </a>
                <br />
            </td> 
        </tr>
	</tbody>
</table>

## Quickstart

Prereqs
- Node.js 18+
- A Hedera testnet account (Account ID + Ed25519 private key)
- An ECDSA private key (0x… hex) for EVM transactions (ethers/Hardhat)

1) Configure environment

Copy .env.example to .env and fill these minimum values (root of repo):

```env
# Network and RPC
HEDERA_NETWORK=testnet
RPC_URL=https://testnet.hashio.io/api
MIRROR_NODE_URL=https://testnet.m

## Usage 

Run this on the frontend.

npm install && npm run dev

Run this on the backend. 

python3 -m venv .venv && source .venv/bin/activate 
uvicorn src.main:app --reload --port 8000