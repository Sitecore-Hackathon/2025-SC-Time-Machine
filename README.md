# Sitecore JSS redirects performance optimization

## Team name
SC Time Machine

## Description
The main goal of the submission is to demonstrate possible way how to improve overall performance of NextJs based JSS application by reducing count of requests to Sitecore Experience Edge endpoint by Sitecore JSS redirects middleware. This is implementation of one of Vercel recommendations related to ([Sitecore JSS implementations.](https://vercel.com/guides/how-to-optimize-next.js-sitecore-jss#redirect-middleware-plugin))

Out of the box each request to Sitecore NextJs JSS application causes a request to Sitecore Experience Edge to fetch redirects. Despite the fact some caching implemented there, in case of JSS application under high traffic there will be performance impact on JSS application. 

The module submission solves the issue by fetching site redirects at application build stage instead of middleware runtime. It can be useful in case if redirects are not updated frequently by content authors or content  developers.

The idea is to have Sitecore JSS NextJs configuration plugin that fetches website redirects at application build step:
![Config plugin](docs/images/fetch-redirects-config-plugin.png?raw=true "config plugin")
that saves intermediate results into the JSS runtime configuration placed at "src/temp/config.js":
![Config](docs/images/config.png?raw=true "config")

Then redirects are used in  **next.config.js** file to configure standalone NextJs redirects  and rewrites:  

     async redirects() {
        var redirects = JSON.parse(jssConfig.redirects);
    
        return redirects;
      },
    
      async rewrites() {
        var transfers = Array.from(JSON.parse(jssConfig.transfers));
    
        // When in connected mode we want to proxy Sitecore paths off to Sitecore
        const systemTransfers = [
          // API endpoints
          {
            source: '/sitecore/api/:path*',
            destination: `${jssConfig.sitecoreApiHost}/sitecore/api/:path*`,
          },
          // media items
          {
            source: '/-/:path*',
            destination: `${jssConfig.sitecoreApiHost}/-/:path*`,
          },
          // healthz check
          {
            source: '/healthz',
            destination: '/api/healthz',
          },
          // rewrite for Sitecore service pages
          {
            source: '/sitecore/service/:path*',
            destination: `${jssConfig.sitecoreApiHost}/sitecore/service/:path*`,
          },
        ];
    
        const resultTransfers = systemTransfers.concat(transfers);
    
        return resultTransfers;
      },
    };

Using this approach it is possible to improve performance of NextJs JSS application by reducing requests to Sitecore Experience Edge.

## Video link

[Sitecore Hackathon 2025. SC Time Machine Team.](https://youtu.be/_OiZkQqazqo)

## Pre-requisites and Dependencies

This functionality is implemented on top of Sitecore XmCloud environment, but can work with Sitecore OnPrem deployments the same way.

 -  Windows PowerShell
 - The current long-term support (LTS) version of NodeJs
 - .NET Core 6.0 SDK
 - Docker for Windows with Windows containers enabled

## Installation instructions
In Powershell:

    cd {repo_folder_path}\local-containers\scripts
    .\init.ps1 -LicenseXmlPath C:\license\license.xml -AdminPassword b
   Please make sure you updated path to your Sitecore license in the command above.  

    cd ../
    docker compose build
    docker compose up
    cd ../
    dotnet sitecore login --authority https://auth.sitecorecloud.io --cm https://xmcloudcm.localhost --audience https://api.sitecorecloud.io --client-id Chi8EwfFnEejksk3Sed9hlalGiM9B2v7 --allow-write true
    
Make sure you run the command above (dotnet sitecore login) in context of the repository root folder

    dotnet sitecore ser push
    dotnet sitecore index schema-populate
    dotnet sitecore index rebuild

If it is OK, visit the sample home page should open simple page with text - "Home Page"
Home page - [https://nextjs.xmc-starter-js.localhost/](https://nextjs.xmc-starter-js.localhost/)

## Usage instructions
You can check the functionality works by exploring already existing SXA redirects or adding a new one and then testing it after JSS application restart (JSS application needs to be restarted in order to see the change).

 1. Visit [https://xmcloudcm.localhost/sitecore/shell/?sc_lang=en](https://xmcloudcm.localhost/sitecore/shell/?sc_lang=en)
 2. You will need to sign in, so enter your XMCloud credentials if you have them, in case no - Sign Up is also possible.
 3.  You can explore already present redirects in the redirect map (/sitecore/content/Hackathon2025/Hackathon2025Site/Settings/Redirects/Redirect Map), feel free to add your own redirect for testing purposes.
 4. In case you updated redirects you need to restart the JSS application to see the change
 

    docker restart {container_id}

 where {container_id} is the ID of the **xmcloud-starter-js-rendering-nextjs-1** container.
 For example, if you have the following redirect:
![Sample Redirect](docs/images/config.png?raw=true "Sample Redirect")
Request to [https://nextjs.xmc-starter-js.localhost/first](https://nextjs.xmc-starter-js.localhost/first)
should be redirected to [https://nextjs.xmc-starter-js.localhost/redirectedfromfirst](https://nextjs.xmc-starter-js.localhost/redirectedfromfirst)

## Comments
This is a proof of concept of course. In the future it should/can be extracted into a separate NPM package in order to separate it from JSS application itself.
Also additional features and use cases should be implemented, like multisite. 
