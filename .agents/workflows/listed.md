---
description: Sign the firefox extension as listed.
---

JWT issuer: user:19933540:630
JWT secret: 34404f339cdfa68f6503d0634863c43de55747879f782c1892d422741fa9e013

Use the following command to sign the firefox extension. Credentials are above.

npx web-ext sign --channel=listed --api-key=<YOUR_AMO_JWT_ISSUER> --api-secret=<YOUR_AMO_JWT_SECRET> --source-dir dist/firefox

Wait until the signing process finish, then copy the latest xpi file from web-ext-artifacts to the releases/<current version folder>

Generate a ready-to-go chrome extension zip file. Also copy that into releases/<current version folder>

Bumped the version number only if there's a conflict and repeat the sign command.

Make a git push. And make a git release with the zip and xpi file of the version. Log the changes. Proceed without asking for permission.