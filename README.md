# Test SSE and WebSocket in http/1 and http/2

This is a test case to check out functionality of Websocket and SSE (Server Sent Events) over http/1.1 and in the new http/2 protocol.

![Test SSE and Websocket in http1 and http2](http://i68.tinypic.com/1zxsear.jpg)
## Description
The project constitutes of 5 main .js files. Each file checks a push technology (Websocket or SSE) over a web protocol (http1 or http2).

|   File         | Protocol  | SSL | Push Technology |  Port |
|----------------|-----------|----|----------|-----------|
|http1-sse.js    | http/1    | yes | SSE         | 1333 |
|http1-ws.js     | http/1    | no | WebSocket   | 1334 |
|http2-sse.js    | http/2    | yes | SSE   	   | 1335 |
|http2-ws.js     | http/2    | yes | WebSocket | 1336 |
|https1-ws.js    | http/1    | yes | WebSocket | 1337 |

The files are independent of each other and they are run separately through index.js.

As it is visible, all of the programs use SSL except the second one. http1-ws.js is exactly the same as https1-ws.js except that it runs without SSL. The reason why this program was needed is that not all browsers support Websocket over SSL with a fake SSL certificate in a local web server (localhost).

## Execution
The main index.js file receives name of a file from command line argument and executes that. For example, in order to run http1-sse.js you need to run the following command.

    node http1-sse.js

After execution, a http server is created and listens on a specific port based on the previous table.

http://localhost:1334 or https://localhost:1335 (whether SSL is used by the web server or not).

Having a different port number for each file enables us to run and test multiple files through multiple terminals simultaneously which is beneficial when comparing two push technology or protocols together at the same time.

In order to run the applications under HTTPS, a SSL certificate was required. To that matter, a fake certificate generated using openssl and is put in the project.

	* It is recommended to test the applications in Chrome browser.

As it mentioned before, the SSL version of the program which uses Websocket as its push mechanism does not work in all browsers. The reason is that not all browsers support fake SSL certificates in local web servers. Only Chrome browser supports Websocket with a fake SSL certificate which is not enabled by default. In order to enable insecure SSL certificates for local web servers in Chrome, enter the following address in Chrome.

	chrome://flags/#allow-insecure-localhost

Enable the 'allow-insecure-localhost' option in the appeared window and restart Chrome.

![Chrome, Allow insecure localhost](http://i67.tinypic.com/zvwn11.jpg)

## Dependencies
The project is written based on core NodeJs modules but uses two external library that are mentioned in package.json file. These libraries are "mime-types" and "ws". Before using the programs you need to install dependencies through npm installl command.

    npm install
    
## Behavior
While the files are separate, they all run the same application with the same functionality, look and feel and behavior. They create a web server with a single index.html file to serve as the default web page. The page shows a simple Forex table for various commodities. The data is provided by the server. Every 3-5 seconds the server changes the price of a random commodity and notifies all browsers who are connected to him by a push notification technology.

## Programming
The codes are written in NodeJs. The client side part is written in javascript and uses jQuery library.


## Web Application
The web application files for all the programs are put in a folder named 'public'. For each program a separate folder is specified with the same name as the program. Each web server knows his own folder and is configured to serve the files in its that folder. A request to the root of the website - '/' - returns index.html file from the root folder of that application. For example http1-sse returns /public/http1-sse/index.html.

