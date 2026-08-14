/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  importScripts("/sw-push.js");
  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "sw-push.js",
    "revision": "2ef67836b5a6e6f434008b0bbd2b2fb9"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "index.html",
    "revision": "2e86d26d8adcff2d95e37c42ca518465"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "0ab87734c997d4cd0bd5729fd01034f3"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "1bd4c83462170b0b4061fa70fa31cce3"
  }, {
    "url": "icons/badge-72x72.png",
    "revision": "f9a3882dea3cafbdf058e25d8e4ca697"
  }, {
    "url": "assets/zap-OiaXgnuS.js",
    "revision": null
  }, {
    "url": "assets/wallet-vMh6qE8n.js",
    "revision": null
  }, {
    "url": "assets/users-round-D_BgXhni.js",
    "revision": null
  }, {
    "url": "assets/truck-D1Wbjeh6.js",
    "revision": null
  }, {
    "url": "assets/trophy-Dj1sVHtN.js",
    "revision": null
  }, {
    "url": "assets/trending-up-z5QHuUbd.js",
    "revision": null
  }, {
    "url": "assets/star-UDv87_yM.js",
    "revision": null
  }, {
    "url": "assets/sparkles-CV0cGhEf.js",
    "revision": null
  }, {
    "url": "assets/shield-check-CsFFxuJT.js",
    "revision": null
  }, {
    "url": "assets/send-BVkeYPSO.js",
    "revision": null
  }, {
    "url": "assets/rotate-ccw-BOb6DfEe.js",
    "revision": null
  }, {
    "url": "assets/plus-CijnJVdY.js",
    "revision": null
  }, {
    "url": "assets/phone-call-DktqCGRa.js",
    "revision": null
  }, {
    "url": "assets/percent-DS4wHtpe.js",
    "revision": null
  }, {
    "url": "assets/map-pin-DcH66Gg5.js",
    "revision": null
  }, {
    "url": "assets/loader-circle-CqqnOx15.js",
    "revision": null
  }, {
    "url": "assets/index-B3KnVqWv.css",
    "revision": null
  }, {
    "url": "assets/index-0jqNOdmc.js",
    "revision": null
  }, {
    "url": "assets/gem-CYCbNGvg.js",
    "revision": null
  }, {
    "url": "assets/download-gYB-W9ya.js",
    "revision": null
  }, {
    "url": "assets/dollar-sign-CzK-K4tM.js",
    "revision": null
  }, {
    "url": "assets/copy-Ci6wQJsx.js",
    "revision": null
  }, {
    "url": "assets/clock-3-DqiFb5Ov.js",
    "revision": null
  }, {
    "url": "assets/clipboard-list-opH4hSmb.js",
    "revision": null
  }, {
    "url": "assets/circle-check-D8nwXWZS.js",
    "revision": null
  }, {
    "url": "assets/circle-alert-C83q4HY-.js",
    "revision": null
  }, {
    "url": "assets/calendar-B1rUbmJA.js",
    "revision": null
  }, {
    "url": "assets/badge-check-BTguqepO.js",
    "revision": null
  }, {
    "url": "assets/award-CwCx32F3.js",
    "revision": null
  }, {
    "url": "assets/arrow-up-right-BMJpfW6T.js",
    "revision": null
  }, {
    "url": "assets/arrow-right-BOm0Lk93.js",
    "revision": null
  }, {
    "url": "assets/arrow-left-BoV7SREI.js",
    "revision": null
  }, {
    "url": "assets/VoiceOfCustomerPage-BjnYiAIm.js",
    "revision": null
  }, {
    "url": "assets/UsersPage-C-NlnS51.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-BBbuD5gi.js",
    "revision": null
  }, {
    "url": "assets/RetentionRadarPage-DvLBl3Wn.js",
    "revision": null
  }, {
    "url": "assets/RepresentativePortalPage-DN6j9skW.js",
    "revision": null
  }, {
    "url": "assets/RepresentativeNetworkPage-dht5G3Hw.js",
    "revision": null
  }, {
    "url": "assets/ReportsPage-zDsR6yWO.js",
    "revision": null
  }, {
    "url": "assets/ProjectsPage-CYKj_-SO.js",
    "revision": null
  }, {
    "url": "assets/PieChart-Di6zDVcE.js",
    "revision": null
  }, {
    "url": "assets/NotificationsPage-Bdp1ubFI.js",
    "revision": null
  }, {
    "url": "assets/NotFoundPage-CERv9Z9W.js",
    "revision": null
  }, {
    "url": "assets/MemberPortalPage-Bob5Ush6.js",
    "revision": null
  }, {
    "url": "assets/MemberLoginPage-COH1d9uP.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyTiersPage-CduqadnZ.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyRulesPage-DuGR7X5f.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyRewardsPage-BbhApAO5.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyMembersPage-BrJv03XB.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyLedgerPage-CbR4arWE.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyEngagementPage-D8RoXUFL.js",
    "revision": null
  }, {
    "url": "assets/LoyaltyDashboardPage-Bhpyq3eR.js",
    "revision": null
  }, {
    "url": "assets/LoginPage-BTwGWobM.js",
    "revision": null
  }, {
    "url": "assets/LeadsPage-DCL-_TmH.js",
    "revision": null
  }, {
    "url": "assets/InvoicesPage-CEto2QnH.js",
    "revision": null
  }, {
    "url": "assets/CustomerDetailPage-DPLKijbX.js",
    "revision": null
  }, {
    "url": "assets/CsatPage-DaDlnX_E.js",
    "revision": null
  }, {
    "url": "assets/CampaignPage-B3sV7uCU.js",
    "revision": null
  }, {
    "url": "assets/BusinessOperationsPage-DDPPiu8U.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-3x57Po7x.js",
    "revision": null
  }, {
    "url": "icons/badge-72x72.png",
    "revision": "f9a3882dea3cafbdf058e25d8e4ca697"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "1bd4c83462170b0b4061fa70fa31cce3"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "0ab87734c997d4cd0bd5729fd01034f3"
  }, {
    "url": "manifest.webmanifest",
    "revision": "315bc0f4433ca0ef8e75b93322193fca"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https?:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https?:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
