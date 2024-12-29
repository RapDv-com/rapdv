# RapDv
[RapDv - Rapid Development Framework](https://rapdv.com)

Build web applications quickly. [Docs](https://rapdv.com/docs).

## Back-end technologies:
- Node.js
- TypeScript
- SCSS
- React
- Express
- MongoDB

## Front-end technologies:
- Bootstrap
- NProgress
- Pjax

## Install dependencies
`npm install`  

## Build server and client
`npm run build`  

## Test this library
`npm run test-server`  

## Format code
`npm run format-code`

## Architecture
Server and client side dependencies are in `package.json` and are installed to `node_modules`.  

Both client and server consist of modular structure. 
That means certain folder structure:

client/  
  ├── app/  
  ├── elements/  
server/  
  
  
Folders functions:  
`app` - Consist of main application, server or client. It basically wires all elements together.  
`elements` - Independent elements.  
