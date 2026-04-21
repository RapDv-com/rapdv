# RapDv
[RapDv - Rapid Development Framework](https://rapdv.com)

Build web applications quickly. [Docs](https://rapdv.com/docs).

## Examples
- [Starter App](https://github.com/RapDv-com/rapdv-starter-app)  
- [Blog with CMS](https://github.com/RapDv-com/rapdv-cms).  

## Back-end technologies:
- Node.js
- TypeScript
- SCSS
- React
- Express
- MariaDB/PostgreSQL + Sequelize

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

### Coding style
- Every file needs to have name in PascalCase and be a class
- All code should be writted in an object-oriented way, and all functions should be methods of a class
- Don't use variables with single letter names, except for loop counters. Use descriptive names for variables and functions.
- Don't use magic numbers, use constants with descriptive names instead.
