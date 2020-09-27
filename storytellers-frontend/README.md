# Storytellers frontend

## Overview

The Storytellers frontend was built with **Angular** + **Bootstrap**.

## Getting started

Install the Vercel CLI:

    npm i -g vercel

Install project dependencies:

    npm i

Start the application:

    ng serve

## Testing web push notifications

    npm i -g http-server
    ng build --prod
    cd dist/storytellers
    http-server -p 4200 --proxy http://localhost:3000

## Deploying the application

Run the following command to deploy to production:

    vercel --prod

Or run the following to deploy to the preview environment:

    vercel
