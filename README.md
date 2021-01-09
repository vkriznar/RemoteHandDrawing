# RemoteHandDrawing

## Dependencies

- Node

## Setup

- To install all dependencies, in root folder Run `npm install`
- Inside root folder create folder `ssl`
- Generate self signed certificate (You can use http://www.selfsignedcertificate.com/ and type localhost)
- Download `localhost.key` and `locahost.cert` and copy them to previously created ssl folder and rename them to `server.key` and `server.cert`
- Run `node server.js`

Node will setup a local server on your computer and you can access the admin page by visiting either https://localhost:3000/admin or https://your-ip-address:3000/admin. For users to join, you can click on button **Copy URL for Users**, and url will be copied to your clipboard.
