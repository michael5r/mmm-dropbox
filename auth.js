/* eslint-disable @stylistic/indent */
require("dotenv").config();
const fs = require("fs");
const app = require("express")();
const fetch = require("node-fetch");

const hostname = process.env.DROPBOX_AUTH_HOSTNAME;
const port = process.env.DROPBOX_AUTH_PORT;

const dropBoxConfig = {
	fetch,
	clientId: process.env.DROPBOX_APP_KEY,
	clientSecret: process.env.DROPBOX_APP_SECRET
};

const { Dropbox } = require("dropbox");

const dbx = new Dropbox(dropBoxConfig);

const redirectUri = `http://${hostname}:${port}/auth`;
const authUrl = dbx.auth.getAuthenticationUrl(redirectUri, null, "code", "offline", null, "none", false)

app.get("/", (req, res) => {
	.then((authUrl) => {
		res.writeHead(302, { Location: authUrl });
		res.end();
	});
});

app.get("/auth", (req, res) => {
  const { code } = req.query;
  dbx.auth.getAccessTokenFromCode(redirectUri, code)
    .then((token) => {
      console.log(`Token Result: ${JSON.stringify(token)}`);
      dbx.auth.setRefreshToken(token.result.refresh_token);
      dbx.usersGetCurrentAccount()
        .then((response) => {
          token.result.expires_at = Date.now() + token.result.expires_in * 1000 - 10000;
          fs.writeFileSync("credentials.json", JSON.stringify(token.result, null, 2));
          const message = "Successfully authenticated and created credentials.json file. You may now close the browser.";
          console.log(message);
          process.exit(0);
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.log(error);
    });
	res.end();
});

app.listen(port);
console.log(`Server listening. Browse to ${authUrl} to authenticate.`);
