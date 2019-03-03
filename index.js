/* 
 * This is a barely minimum implementation of an oidc server
 * For demonstration purposes only so a student can understand 
 * the inner workings of OAuth2 and OpenID Connect
 */

// server name and port
const SERVER_NAME = 'https://localhost';
const PORT = 3001;

// if app is mounted behind a proxypass, change the following line                                                                                      // i.e. const prefix = '/oauth';
const prefix = '/oauth';

// Be sure to check out the full set of configuration options at
// https://github.com/panva/node-oidc-provider/blob/master/docs/configuration.md

const Provider = require('oidc-provider');
const configuration = {
    findById: async function(ctx, id) {
	return {
	    accountId: id,
	    claims: async function(use, scope, claims, rejected) { 
		return { sub: id }; 
	    }
	};
    },    
    features: {
	devInteractions: false,
	pkce: { supportedMethods: ['plain', 'S256'] }
    },
    interactionUrl: async function(ctx, interaction) {
	return `interaction/${ctx.oidc.uuid}`;
    }
};

// List of valid users we can authenticate
const users = {
    'bob': 'abcde'
}

// See https://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata for all the options
// Here we create a couple of clients
const clients = [
    {
	// This client uses all the defaults, which only uses the 'code' response_type
	client_id: 'foo',
	client_secret: 'bar',
	redirect_uris: ['https://learn.operatoroverload.com/~jmadar/oauth/callback.html']
    },
    {
	// This client uses the native type and alows for 'token id_token' response_type
	client_id: 'foo2',
	client_secret: 'bar',	
	grant_types: ['implicit'],
	
	// Note: only native application type allows localhost in the redirect_uris
	application_type: 'native',
	response_types: ['token id_token'],
	redirect_uris: ['http://localhost:3001','https://learn.operatoroverload.com/~jmadar/oauth/callback.html']
    }
];

// Create the provider
const oidc = new Provider(SERVER_NAME, configuration);

// Create the server, using express
( async () => {
    await oidc.initialize({ clients });
    oidc.proxy = true;
    
    let server = require('express')();
    server.set('trust proxy', true);

    server.get(`${prefix}/`, (req, res) => {
	res.send('wmdd4950 openid connect server');
    });

    // This is the rendered login page, when it is POSTed, will use the route below to process the login    
    server.get(`${prefix}/interaction/:grant`, (req, res) => {
	oidc.interactionDetails(req).then( details => {
	    //console.log(details);
	    const loginPage = `
		<form method="POST">
		<input type="text" name="userid">
		<input type="password" name="password">
		<input type="submit">
		</form>
		`;
	    res.send(loginPage);
	});
    });

    
    let parse = require('body-parser').urlencoded({ extended: false });
    
    // This is the route that will handle the actual login and redirect
    server.post(`${prefix}/interaction/:grant`, parse, (req, res, next) => {
	//console.log(req.body);
	
	let details = {};

	if (users[req.body.userid] == req.body.password) {
	    console.log(`login successful for ${req.body.userid}`);
	    details = {
		login: {
		    account: req.body.userid,
		    remember: true,
		    ts: Math.floor(Date.now() / 1000)
		},
		consent: {
		    rejectedScopes: []
		}
	    }
	}
	return oidc.interactionFinished(req, res, details);
    });

    server.use(prefix, oidc.callback);
    server.listen(PORT);
})();

