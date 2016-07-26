'use strict';

/*jshint expr: true*/

const expect = require( 'chai' ).expect;

const JWTConfiguration = require( '../../../../lib/plugins/jwt/configuration' );

describe( 'lib/plugins/jwt/configuration', function() {

    describe( 'JWTConfiguration', function() {

        let configuration;

        beforeEach( function() {

            configuration = new JWTConfiguration();
        });

        describe( 'constructor', function() {

            it( 'normal operation', function() {

                expect( configuration.constructor.name ).to.equal( 'JWTConfiguration' );

                expect( configuration.enabled ).to.be.false;
                expect( configuration.useXsrf ).to.be.false;
            });
        });

        describe( '.update', function() {

            [ 'HS256', 'HS384', 'HS512' ].forEach( function( algorithm ) {

                let options = {

                    algorithm,
                    secret: 'my-secret'
                }

                it( 'options: ' + JSON.stringify( options ), function() {

                    configuration.update( options );

                    expect( configuration.state ).to.eql( { algorithm, key: 'my-secret', enabled: true, xsrf: false, tokenName: 'jwt' } );
                });
            });

            [ 'RS256' ].forEach( function( algorithm ) {

                let options = {

                    algorithm,
                    public_key: 'my-pub-key'
                }

                it( 'options: ' + JSON.stringify( options ), function() {

                    configuration.update( options );

                    expect( configuration.state ).to.eql( { algorithm, key: 'my-pub-key', enabled: true, xsrf: false, tokenName: 'jwt' } );
                });
            });

            it( 'token_name', function() {

                let options = {

                    token_name: 'JWT'
                };

                configuration.update( options );

                expect( configuration.state ).to.eql( { tokenName: 'JWT', enabled: true, xsrf: false } );
            });

            it( 'xsrf = true, xsrf_token_name and xsrf_claim_name', function() {

                let options = {

                    xsrf: true,
                    xsrf_token_name: 'XSRF-TOKEN',
                    xsrf_claim_name: 'xsrf'
                };

                configuration.update( options );

                expect( configuration.state ).to.eql( { xsrf: true, xsrfToken: 'XSRF-TOKEN',
                                                  xsrfClaimName: 'xsrf', enabled: true, tokenName: 'jwt' } );
            });

            it( 'xsrf = true, xsrf_token_name and xsrf_claim_name', function() {

                let options = {

                    xsrf: false,
                    xsrf_token_name: 'XSRF-TOKEN',
                    xsrf_claim_name: 'xsrf'
                };

                configuration.update( options );

                expect( configuration.state ).to.eql( { xsrf: false, tokenName: 'jwt', enabled: true } );
            });

            it( 'unknown algorithm', function() {

                configuration.update( { algorithm: 'special' } );

                expect( configuration.state ).to.eql( { enabled: false } );
            });

            it( 'options not supplied', function() {

                configuration.update();

                expect( configuration.state ).to.eql( { enabled: false } );
            });

            it( 'options = null', function() {

                configuration.update( null );

                expect( configuration.state ).to.eql( { enabled: false} );
            });
        });

        describe( '.isEnabled', function() {

            it( 'default case via configuration.update( {} )', function() {

                configuration.update( {} );

                expect( configuration.isEnabled() ).to.be.false;
            });

            it( 'default case via configuration.update()', function() {

                configuration.update();

                expect( configuration.isEnabled() ).to.be.false;
            });

            it( 'enabled = true via configuration( { enable: true } )', function() {

                configuration.update( { enable: true } );

                expect( configuration.isEnabled() ).to.be.true;
            });

            it( 'enabled = true via configuration( { algorithm: "HS256" } )', function() {

                configuration.update( { algorithm: "HS256" } );

                expect( configuration.isEnabled() ).to.be.true;
            });

            it( 'enabled = false via configuration( { algorithm: "unknown" } )', function() {

                configuration.update( { algorithm: "unknown" } );

                expect( configuration.isEnabled() ).to.be.false;
            });
        });

        describe( '.resolve', function() {

            it( 'all set in configuration', function() {

                configuration.update( {

                    algorithm: 'HS256',
                    secret: 'my-secret',
                    token_name: 'my-token',
                    xsrf: true,
                    xsrf_token_name: 'my-xsrf-token',
                    xsrf_claim_name: 'my-xsrf-claim',
                });

                let configValues = configuration.resolve( {} );

                expect( configValues ).to.eql( {

                    algorithm: 'HS256',
                    key: 'my-secret',
                    xsrf: true,
                    tokenName: 'my-token',
                    xsrfTokenName: 'my-xsrf-token',
                    xsrfClaimName: 'my-xsrf-claim'
                })
            });

            it( 'all set in configuration with stage vars', function() {

                configuration.update( {

                    algorithm: 'HS256',
                    secret: 'my-secret',
                    token_name: 'my-token',
                    xsrf: true,
                    xsrf_token_name: 'my-xsrf-token',
                    xsrf_claim_name: 'my-xsrf-claim',
                });

                let configValues = configuration.resolve( {

                    VANDIUM_JWT_ALGORITHM: 'HS512',
                    VANDIUM_JWT_SECRET: 'special',
                    VANDIUM_JWT_XSRF_TOKEN_NAME: 'xsrf',
                    VANDIUM_JWT_XSRF_CLAIM_NAME: 'xsrf',
                    VANDIUM_JWT_TOKEN_NAME: 'special-token'
                });

                expect( configValues ).to.eql( {

                    algorithm: 'HS256',
                    key: 'my-secret',
                    xsrf: true,
                    tokenName: 'my-token',
                    xsrfTokenName: 'my-xsrf-token',
                    xsrfClaimName: 'my-xsrf-claim'
                })
            });

            it( 'none set in configuration, but set in stage using HS algorithm', function() {

                let configValues = configuration.resolve( {

                    VANDIUM_JWT_ALGORITHM: 'HS256',
                    VANDIUM_JWT_SECRET: 'my-secret',
                    VANDIUM_JWT_XSRF_TOKEN_NAME: 'my-xsrf-token',
                    VANDIUM_JWT_XSRF_CLAIM_NAME: 'my-xsrf-claim',
                    VANDIUM_JWT_TOKEN_NAME: 'my-token'
                });

                expect( configValues ).to.eql( {

                    algorithm: 'HS256',
                    key: 'my-secret',
                    xsrf: true,
                    tokenName: 'my-token',
                    xsrfTokenName: 'my-xsrf-token',
                    xsrfClaimName: 'my-xsrf-claim'
                });
            });

            it( 'none set in configuration, but set in stage using RS algorithm', function() {

                let configValues = configuration.resolve( {

                    VANDIUM_JWT_ALGORITHM: 'RS256',
                    VANDIUM_JWT_PUBKEY: 'my-pub-key',
                    VANDIUM_JWT_XSRF_TOKEN_NAME: 'my-xsrf-token',
                    VANDIUM_JWT_XSRF_CLAIM_NAME: 'my-xsrf-claim',
                    VANDIUM_JWT_TOKEN_NAME: 'my-token'
                });

                expect( configValues ).to.eql( {

                    algorithm: 'RS256',
                    key: 'my-pub-key',
                    xsrf: true,
                    tokenName: 'my-token',
                    xsrfTokenName: 'my-xsrf-token',
                    xsrfClaimName: 'my-xsrf-claim'
                });
            });

            it( 'fail: when algorithm is not supported', function() {

                expect( configuration.resolve.bind( configuration, { VANDIUM_JWT_ALGORITHM: 'HS1048' } ) )
                    .to.throw( 'authentication error: unsupported jwt algorithm: HS1048' );
            });

            it( 'fail: when algorithm not set', function() {

                expect( configuration.resolve.bind( configuration, {} ) ).to.throw( 'missing algorithm' );
            });

            it( 'fail: when secret not set, using HS algorithm', function() {

                expect( configuration.resolve.bind( configuration, { VANDIUM_JWT_ALGORITHM: 'HS256' } ) )
                    .to.throw( 'missing validation key' );
            });

            it( 'fail: when secret not set, using RS algorithm', function() {

                expect( configuration.resolve.bind( configuration, { VANDIUM_JWT_ALGORITHM: 'RS256' } ) )
                    .to.throw( 'missing validation key' );
            });
        });

        describe( '.getIgnoredProperties', function() {

            it( 'not enabled', function() {

                expect( configuration.getIgnoredProperties() ).to.eql( [] );
            });

            it( 'enabled, no stage vars, no xsrf', function() {

                configuration.update( { algorithm: 'HS256' } );

                // default token
                expect( configuration.getIgnoredProperties( {} ) ).to.eql( [ 'jwt' ] );
            });

            it( 'enabled, no stage vars, xsrf enabled', function() {

                configuration.update( { algorithm: 'HS256', xsrf: true } );

                // default token
                expect( configuration.getIgnoredProperties( {} ) ).to.eql( [ 'jwt', 'xsrfToken' ] );
            });

            it( 'enabled, stage vars, no xsrf', function() {

                configuration.update( { algorithm: 'HS256' } );

                // default token
                expect( configuration.getIgnoredProperties( { VANDIUM_JWT_TOKEN_NAME: 'JWT' } ) ).to.eql( [ 'JWT' ] );
            });

            it( 'enabled, stage vars, xsrf enabled', function() {

                configuration.update( { algorithm: 'HS256', xsrf: true } );

                // default token
                expect( configuration.getIgnoredProperties( { VANDIUM_JWT_TOKEN_NAME: 'JWT', VANDIUM_JWT_XSRF_TOKEN_NAME: 'xsrf' } ) )
                    .to.eql( [ 'JWT', 'xsrf' ] );
            });
        });
    });
});