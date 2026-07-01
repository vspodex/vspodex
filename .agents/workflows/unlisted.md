---
description: Sign the firefox extension with web-ext as unlisted and generate a chrome extension zip file
---

JWT issuer: user:19933540:630
JWT secret: 34404f339cdfa68f6503d0634863c43de55747879f782c1892d422741fa9e013

Use the following command to sign the firefox extension. Credentials are above.

npx web-ext sign --channel=unlisted --api-key=<YOUR_AMO_JWT_ISSUER> --api-secret=<YOUR_AMO_JWT_SECRET> --source-dir dist/firefox

Wait until the signing process finish, then copy the latest xpi file from web-ext-artifacts to the releases/<current version folder>

Bumped the version number if there's a conflict. Repeat the sign command.

Generate a ready-to-go chrome extension zip file. Also copy that into releases/<current version folder>

Make a git push. And make a git release with the zip and xpi file of the version. Log the changes. Proceed without asking for permission.