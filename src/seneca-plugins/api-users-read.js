'use strict';

const Promise = require( 'bluebird' );
const db = require( '../db' );

module.exports = function () {

  // Promisify the seneca .act() method
  let act = Promise.promisify( this.act, { context: this });

  this.add( 'init:api-users-read', function( msg, done ) {

    db.init()
      .then( function() {

        done();

      });

  });

  // Get user
  this.add( 'role:api,path:users,cmd:get', function( msg, done ) {

    let userId = ( msg.params.id || msg.query.id );

    const username = msg.query.username,
      isSearch = !! msg.query.search,
      queryParams = {
        filters: {}
      },
      queryOptions = {};

    if ( userId ) {

      if ( -1 !== userId.indexOf( ',' ) ) {

        userId = userId.split( ',' );

      }

      queryParams.id = userId;

    } else if ( username ) {

      if ( isSearch ) {

        queryParams.filters.username = username;

      } else {

        queryParams.username = username;

      }

    }

    // results limit
    if ( msg.query.limit && ! isNaN( msg.query.limit ) ) {

      queryOptions.limit = parseInt( msg.query.limit, 10 );

    }

    // results page
    if ( msg.query.page && ! isNaN( msg.query.page ) ) {

      queryOptions.page = parseInt( msg.query.page, 10 );

    }

    // ordering
    var allowedOrderBy = [
      'username',
      'date'
    ];

    if ( 'desc' === msg.query.order ) {

      queryOptions.order = 'desc';

    }

    if ( 'desc' === msg.query.orderEnd ) {

      queryOptions.orderEnd = 'desc';

    }

    if ( msg.query.orderBy && -1 !== allowedOrderBy.indexOf( msg.query.orderBy ) ) {

      queryOptions.orderByStart = msg.query.orderBy;

      if ( 'date' === queryOptions.orderByStart ) {

        queryOptions.orderByStart = 'timestamp';

      }

    }

    if ( msg.query.orderByEnd && -1 !== allowedOrderBy.indexOf( msg.query.orderByEnd ) ) {

      queryOptions.orderByEnd = msg.query.orderByEnd;

      if ( 'date' === queryOptions.orderByEnd ) {

        queryOptions.orderByEnd = 'timestamp';

      }

    }

    act({
        role: 'api',
        path: 'users',
        cmd: 'getUsers',
        args: queryParams,
        options: queryOptions
      })
      .then( ( result ) => {

        done( null, {
          data: result.data
        });

      })
      .catch( ( err ) => {

        done( err, null );

      });

  });

  return {
    name: 'api-users-read'
  };

};
