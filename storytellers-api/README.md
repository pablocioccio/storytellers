# Storytellers API

## Overview

The Storytellers API consists of several serverless functions hosted on [Vercel](https://vercel.com/docs/serverless-functions/introduction).

## Getting started

Install the Vercel CLI:

    npm i -g vercel

Install dotenv:

    npm i -g dotenv

Install project dependencies:

    npm i

## Secrets

Vercel allows us to treat sensitive information as [secrets](https://vercel.com/docs/cli#commands/secrets).

[This](https://github.com/vercel/vercel/issues/749#issuecomment-533873759.) post contains useful information for manipulating complex secrets, such as API Keys.

When working locally, secrets must be exposed as environment variables using dotenv.

## Working locally

To replicate the Vercel deployment environment, run the following command:

    vercel dev

## Deploying functions

Run the following command to deploy to production:

    vercel --prod

Or run the following to deploy to the preview environment:

    vercel
