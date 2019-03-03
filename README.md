# Basic implementation of an OIDC server

Using the [oidc-provider](https://github.com/panva/node-oidc-provider) package.
The index.js file is well documented and should allow you to bring up your own oidc server

Run it using the command:

```
npm start
```

Or if debuging

```
npm run dev
```

# Endpoints

Redirect browser to the /auth endpoint and proivde the the following parameters: client_id, reponse_type, scope, redirect_uri, and nonce.

```
${SERVER}/auth?client_id=${client_id}&response_type=token id_token&scope=openid&redirect_uri=${uri}&nonce=random_string
```

If you use the 'code' response type, you can exchange the code for token using the /token endpoint
(noticed the basic auth with client_id and client_secret,
see [https://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint](https://openid.net/specs/openid-connect-core-1_0.html#TokenEndpoint)):

```
curl --data 'grant_type=authorization_code&code=${code}' 'https://${client_id}:${client_secret}@${SERVER}/token'
```

The /token endpoint with a code in the POST parameter will allow you to exchange a valid code with a token

With the bearer token you can call the `/me` endpoint to get the user info.

# Mounting on a subpath

By default, this app is expected to be mount on /.  If you want to move it to a different path, you need to
take the following steps:

 1. Modify the prefix variable in the index.js file
 1. Put the prefix behind a ProxyPass if putting a webserver in front, for example, if the prefix is /oauth

```
  ProxyPass         "/oauth" "http://localhost:3001/oauth"
  ProxyPassReverse  "/oauth" "http://localhost:3001/oauth"
```