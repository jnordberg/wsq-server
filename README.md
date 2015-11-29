
wsq-server
==========

Standalone [wsq](https://github.com/jnordberg/wsq) server using
[fs-blob-store](https://github.com/mafintosh/fs-blob-store) and
[leveldown](https://github.com/Level/leveldown).

```bash
# install
npm install -g wsq-server bunyan
# run
wsq-server | bunyan
```


Configuration
-------------

Is done using environment variables:

Name            | Alias       | Default                      | Description
----------------|-------------|------------------------------|---------------------------
`WSQ_PORT`      | `PORT`      | `5000`                       | Port server listens on
`WSQ_STORAGE`   |             | `$HOME/.wsq-server/storage`  | Blob storage directory
`WSQ_DATABASE`  |             | `$HOME/.wsq-server/database` | LevelDB database location
`WSQ_LOG_LEVEL` | `LOG_LEVEL` | `debug`                      | Logging level


License
-------

MIT
