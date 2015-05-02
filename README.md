[![npm version](https://badge.fury.io/js/ultimatum.svg)](http://badge.fury.io/js/ultimatum)
[![Build Status](https://travis-ci.org/konfirm/node-ultimatum.svg?branch=master)](https://travis-ci.org/konfirm/node-ultimatum)
[![Coverage Status](https://coveralls.io/repos/konfirm/node-ultimatum/badge.svg?branch=master)](https://coveralls.io/r/konfirm/node-ultimatum?branch=master)
[![dependencies](https://david-dm.org/konfirm/node-ultimatum.svg)](https://david-dm.org/konfirm/node-ultimatum#info=dependencies)
[![dev-dependencies](https://david-dm.org/konfirm/node-ultimatum/dev-status.svg)](https://david-dm.org/konfirm/node-ultimatum#info=devDependencies)
[![Codacy Badge](https://www.codacy.com/project/badge/d2575db70290498b9f027e3e5837b521)](https://www.codacy.com/app/rogier/node-ultimatum)

# node-ultimatum
Timing management, simplified. Create timeouts, intervals, schedule tasks, postpone timeouts/intervals, respond to events

## Concept
Create an Ultimatum for a callback function, the Ultimatum can then be postponed (optionally to a set threshold limit after which an unconditional execution of the callback takes place). Combine this with a given interval at which the callback should be executed (either once or repeatingly)

## Install
```
npm install --save ultimatum
```

## License
GPLv2 © [Konfirm](https://konfirm.eu)
