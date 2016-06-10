'use strict';

const validator = require( 'validator' );
const db = require( '../db' );
const r = db.r;
const _ = require( 'lodash' );

module.exports = function () {

  this.add( 'role:api,path:users,cmd:getUsers', function( msg, done ) {

    let args = msg.args,
      options = msg.options,
      defaultOptions = {
        limit: 10,
        order: 'asc',
        orderEnd: 'asc',
        orderByEnd: null,
        orderByStart: null,
        page: 1
      };

    options = _.defaults( options, defaultOptions );

    // Limit cant be lower than 1 or higher than 100
    options.limit = Math.min( Math.max( 1, parseInt( options.limit, 10 ) ), 100 );

    // Page cant be lower than 1
    options.page = Math.max( 1, parseInt( options.page, 10 ) );

    // Start the request
    let dataWasFiltered = false,
      request = r.table( 'User' );

    if ( args.id ) {

      dataWasFiltered = true;

      if ( Array.isArray( args.id ) ) {

        args.id.map( function( id ) {

          return validator.escape( id );

        });

        request = request.getAll( r.args( args.id ) );

      } else {

        request = request.get( validator.escape( args.id ) );

      }

    } else if ( args.username ) {

      dataWasFiltered = true;

      // We always work with lowercase usernames

      if ( Array.isArray( args.username ) ) {

        args.username = args.username.map( function( username ) {

          return validator.escape( username.toLowerCase() );

        });

        request = request.getAll( r.args( args.username ), { index: 'lowercase_username' } );

      } else {

        args.username = validator.escape( args.username.toLowerCase() );

        request = request.getAll( args.username, { index: 'lowercase_username' } );

      }

    } else if ( args.email ) {

      dataWasFiltered = true;

      if ( Array.isArray( args.email ) ) {

        request = request.getAll( r.args( args.email ), { index: 'email' } );

      } else {

        request = request.getAll( args.email, { index: 'email' } );

      }

    }

    if ( args.filters && ! _.isEmpty( args.filters ) ) {

      dataWasFiltered = true;

      let filtersCount = 0,
        toExecute;

      if ( args.filters.username ) {

        let localExecute;

        if ( Array.isArray( args.filters.username ) ) {

          args.filters.username.forEach( function( username, index ) {

            if ( 0 !== index ) {

              localExecute = localExecute.or( r.row( 'username' ).match( '(?i)' + validator.escape( username ) ) );

            } else {

              localExecute = r.row( 'username' ).match( '(?i)' + validator.escape( username ) );

            }

          });

        } else {

          localExecute = r.row( 'username' ).match( '(?i)' + validator.escape( args.filters.username ) );

        }

        if ( 0 !== filtersCount ) {

          toExecute = toExecute.and( localExecute );

        } else {

          toExecute = localExecute;

        }

        filtersCount++;

      }

      request = request.filter( toExecute );

    }

    // initial ordering
    if ( options.orderByStart ) {

      if ( dataWasFiltered ) {

        // don't use indexes for ordering as we are not working with a table or a table slice
        options.orderByStart = 'asc' === options.order ? r.asc( options.orderByStart ) : r.desc( options.orderByStart );

      } else {

        // data was not filtered, we can safely use indexed ordering
        options.orderByStart = {
          index: 'asc' === options.order ? r.asc( options.orderByStart ) : r.desc( options.orderByStart )
        };

      }

      request = request.orderBy( options.orderByStart );

    }

    // page
    if ( ( ! args.id || Array.isArray( args.id ) ) && options.page > 1 ) {

      request = request.skip( options.limit * ( options.page - 1 ) );

    }

    // limit
    if ( ( ! args.id || Array.isArray( args.id ) ) && options.limit ) {

      request = request.limit( options.limit );

    }

    // final results ordering
    if ( options.orderByStart && options.orderByEnd ) {

      options.orderByEnd = 'asc' === options.orderEnd ? r.asc( options.orderByEnd ) : r.desc( options.orderByEnd );

      request = request.orderBy( options.orderByEnd );

    }

    request
      .run()
      .then( ( result ) => {

        done( null, {
          data: result
        });

      })
      .catch( ( err ) => {

        done( err, null );

      });

  });

  return {
    name: 'api-users-query'
  };

};
