'use strict';

const validationProvider = require( './validation_provider' ).getInstance();

const utils = require( '../../utils' );

const ValidationError = require( '../../errors' ).ValidationError;

const Plugin = require( '../plugin' );

const parser = require( 'joi-json' ).parser( validationProvider.engine );

function removeReservedKeys( values ) {

    Object.keys( values ).forEach( function( key ) {

        if( (key.charAt( 0 ) === 'V') && (key.indexOf( 'VANDIUM_' ) === 0) ) {

            delete values[ key ];
        }
    });
}

function removeKeys( values, keysToRemove ) {

    if( keysToRemove ) {

        for( let key of keysToRemove ) {

            delete values[ key ];
        }
    }
}

function buildSchema( schema ) {

    let updatedSchema = {};

    for( let key in schema ) {

        let value = schema[ key ];

        if( utils.isString( value ) ) {

            value = parser.parse( value );
        }
        else if( !utils.isFunction( value ) && !utils.isObject( value ) ) {

            throw new Error( 'invalid schema element at: ' + key );
        }

        updatedSchema[ key ] = value;
    }

    return updatedSchema;
}

class ValidationPlugin extends Plugin {

    constructor() {

        super( 'validation' );

        this.ignoredProperties = {};
    }

    execute( pipelineEvent, callback ) {

        if( !this.configuredSchema ) {

            // validation not configured - skip
            return callback();
        }

        try {

            // create values object with *only* the values that we want to verify (i.e. hide the noise)
            var values = utils.clone( pipelineEvent.event );

            // remove all 'VANDIUM_xxxxxx'
            removeReservedKeys( values );

            // remove ignored from other parts of the validation pipeline
            removeKeys( values, pipelineEvent.ignored );

            // skip ignored values
            removeKeys( values, Object.keys( this.ignoredProperties ) );

            let updated = validationProvider.validate( values, this.configuredSchema );

            // update values in event with validated ones
            Object.keys( updated ).forEach( function( key ) {

                pipelineEvent.event[ key ] = updated[ key ];
            });

            callback();
        }
        catch( err ) {

            callback( new ValidationError( err ) );
        }
    }

    configure( config, schemaOnly ) {

        let schema = config.schema;

        if( schema ) {

            this.configuredSchema = buildSchema( schema );
        }
        else if( !schemaOnly ) {

            this.configuredSchema = null;
        }

        if( !schemaOnly ) {

            this.ignoredProperties = {};
            this.ignore( config.ignore || [] );
        }
    }

    ignore() {

        for( var i = 0; i < arguments.length; i++ ) {

            var value = arguments[ i ];

            if( utils.isArray( value ) ) {

                for( let v of value ) {

                    this.ignoredProperties[ v.toString() ] = true;
                }
            }
            else {

                this.ignoredProperties[ value.toString() ] = true;
            }
        }
    }


    get types() {

        return validationProvider.types;
    }

    get validator() {

        return validationProvider.engine;
    }

    get state() {

        let state = {};

        state.enabled = !!this.schema;

        if( state.enabled ) {

            state.keys = Object.keys( this.configuredSchema );
        }

        return state;
    }
}

module.exports = ValidationPlugin;