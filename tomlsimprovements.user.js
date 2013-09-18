// ==UserScript==
// @name          TO MLS Improvements
// @namespace     http://projects.apathyant.com/
// @description	  Improvements the TO MLS Pages
// @include       http://torontomls.net/*
// @include       http://*.torontomls.net/*
// ==/UserScript==

// a function that loads jQuery and calls a callback function when jQuery has finished loading
function addJQuery(callback) {
    var script = document.createElement("script");
    script.setAttribute("src", "//code.jquery.com/jquery-latest.min.js");
    script.addEventListener('load', function () {
        var script = document.createElement("script");
        script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jqueryui/1.8.23/jquery-ui.min.js");
        document.body.appendChild(script);

        script = document.createElement("script");
        script.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery);";
        document.body.appendChild(script);
        script = document.createElement("script");
        script.textContent = "jQuery(window).resize(function() { jQuery('body').data({ windowHeight: window.innerHeight }).trigger('window-resize'); }).triggerHandler('resize');";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);


    script = document.createElement("script");
    script.setAttribute("src", "//www.google.com/jsapi");
    script.addEventListener('load', function () {
        var script = document.createElement("script");
        script.textContent = "google.load('maps', '3', {other_params:'sensor=false', callback: function() { jQuery('body').data('toMlsImprovements').setGoogle(google); } })";
        document.body.appendChild(script);
    }, false);
    document.body.appendChild(script);
}

function main() {
    var toMlsImprovements = new function(jQuery) {
        var that = this,
            $ = jQuery,
            listings = [],
            fx = $({}),
            gq = $({}),
            google,
            geocoder,
            listingScrollPadding = 20,
            templates = {
                'style': function() {
                    return '' +
                        '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.0.4/css/bootstrap-combined.min.css" /> ' +
                        '<style>' +
                        '   .tools {' +
                        '       display: block;' +
                        '       position: relative;' +
                        '   }' +
                        '   .tools .tool-area {' +
                        '       background-color: #e7f3ff;' +
                        '       border: 1px solid #909090;' +
                        '   }' +
                        '   .tools.active .tool-area {' +
                        '       background-color: #f3ffe7;' +
                        '   }' +
                        '   .tools .contents {' +
                        '       padding: 6px 5px;' +
                        '       text-align: center;' +
                        '       margin: 0;' +
                        '   }' +
                        '   .tools .toolbar {' +
                        '       border-bottom: none;' +
                        '   }' +
                        '   .toolbar .right {' +
                        '       position: absolute;' +
                        '       right: 5px;' +
                        '   }' +
                        '   .toolbar .left {' +
                        '       position: absolute;' +
                        '       left: 5px;' +
                        '   }' +
                        '   .toolbar h5 {' +
                        '       display: inline-block;' +
                        '       height: 20px;' +
                        '       line-height: 1.0;' +
                        '   }' +
                        '   .toolbar p {' +
                        '       margin: 3px 0;' +
                        '   }' +
                        '   .toolbar .image-position {' +
                        '       display: none;' +
                        '   }' +
                        '   .sidebar {' +
                        '       position: absolute;' +
                        '       width: 400px;' +
                        '   }' +
                        '   .sidebar.left {' +
                        '       left: -400px;' +
                        '   }' +
                        '   .sidebar.right {' +
                        '       right: -400px;' +
                        '   }' +
                        '   .frame {' +
                        '       position: absolute;' +
                        '       left: 0; right: 0;' +
                        '       margin-top: 1px;' +
                        '       z-index: 1000;' +
                        '       overflow: hidden;' +
                        '   }' +
                        '   .image-frame .images {' +
                        '       overflow: hidden;' +
                        '   }' +
                        '   .image-frame .image img {' +
                        '       height: auto;' +
                        '   }' +
                        '   .map-frame .map {' +
                        '       width: 80%;' +
                        '       height: 600px;' +
                        '   }' +
                        '   .map-frame .map img {' +
                        '       max-width: none;' +
                        '   }' +
                        '   .matte { ' +
                        '       position: absolute; top: 0; left: 0; right: 0; bottom: 0;' +
                        '       position: fixed;' +
                        '       background-color: white;' +
                        '       opacity: 0.5;' +
                        '   }' +
                        '   .shadow {' +
                        '       -webkit-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.25);' +
                        '          -moz-box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.25);' +
                        '               box-shadow: 3px 3px 5px 0px rgba(0, 0, 0, 0.25);' +
                        '       margin-bottom: 5px;' +
                        '   }' +
                        '   .cf { zoom: 1; }' +
                        '   .cf:before,' +
                        '   .cf:after { content: ""; display: table; }' +
                        '   .cf:after { clear: both; }' +
                        '</style>';
                },
                'tools': function(vars) {
                    return '' +
                        '<div class="tools" style="width: '+ vars.width +';"></div>'
                },
                'toolbar': function(vars) {
                    return '' +
                        '<div class="toolbar tool-area">' +
                        '   <div class="contents cf btn-toolbar">' +
                        '       <div class="pull-right right">' +
                        '           <div class="btn-group image-toggle">' +
                        '               <span class="btn btn-mini show-frame" data-frame="image"><i class="icon-picture"></i></span>' +
                        '           </div>' +
                        '           <div class="btn-group image-switcher">' +
                        '               <span class="btn btn-mini previous"><i class="icon-arrow-left"></i></span>' +
                        '               <span class="btn btn-mini next"><i class="icon-arrow-right"></i></span>' +
                        '           </div>' +
                        '           <div class="btn-group image-tools">' +
                        '               <span class="btn btn-mini zoom-in"><i class="icon-zoom-in"></i></span>' +
                        '               <span class="btn btn-mini zoom-out"><i class="icon-zoom-out"></i></span>' +
                        '               <span class="btn btn-mini zoom-reset"><i class="icon-remove"></i></span>' +
                        '           </div>' +
                        '       </div>' +
                        '       <div class="pull-left left">' +
                        '           <h5>MLS: ' + vars.mls + ' <small><br />' + vars.price + '</small></h5>' +
                        '           <div class="btn-group">' +
                        '               <a class="btn btn-mini show-frame map" data-frame="map" target="_blank" href="https://maps.google.com/?q=' + encodeURI(vars.address) + '"><i class="icon-map-marker"></i></a>' +
                        '           </div>' +
                        '           <div class="btn-group">' +
                        '               <a class="btn btn-mini search-guava" target="_blank" href="https://google.com/search?q=site:guava.ca+' + encodeURI('"' + vars.address.replace(/, Toronto, ON$/, '') + '"') + '"><i class="icon-search"></i> Guava</a>' +
                        '           </div>' +
                        '       </div>' +
                        '       <p>' +
                        '           <span class="image-count label label-info">Images: ' + vars.imageCount + '</span>' +
                        '           <span class="image-position label label-info">Image <span class="current">0</span> of ' + vars.imageCount + '</span>' +
                        '       </p>' +
                        '   </div>' +
                        '</div>';
                },
                'leftSidebar': function(vars) {
                    return '' +
                        '<div class="sidebar left">' +
                        '       <div class="street-view shadow"><img src="'+ vars.streetViewSrc +'"></div>' +
                        '</div>';
                },
                'rightSidebar': function(vars) {
                    return '' +
                        '<div class="sidebar right">' +
                        '       <div class="map shadow"><img src="'+ vars.mapSrc +'"></div>' +
                        '</div>';
                },
                'imageFrame': function(vars) {
                    var tpl = '';
                    tpl += '' +
                        '<div class="image-frame frame">' +
                        '   <div class="images">';

                    if(vars.images) $.each(vars.images, function(i, el) {
                        tpl += '' +
                            '<div class="image">' +
                            '   <a href="'+el+'"><img src="'+el+'" class="shadow" /></a>' +
                            '</div>';
                    })

                    tpl += '' +
                        '   </div>' +
                        '</div>';
                    return tpl;
                },
                'mapFrame': function(vars) {
                    return '' +
                        '<div class="map-frame frame">' +
                        '   <div class="map shadow">' +
                        '       <!--<iframe width="425" height="350" frameborder="0" scrolling="no" ' +
                        '           marginheight="0" marginwidth="0" src="https://maps.google.com/?' +
                                        'f=q' +
                                        '&amp;source=s_q' +
                                        '&amp;aq=0' +
                                        '&amp;q=' + encodeURI(vars.address) +
                                        '&amp;t=m' +
                                        '&amp;z=13' +
                                        '&amp;output=embed">' +
                        '       </iframe>-->' +
                        '   </div>';
                        '</div>';
                }
            };

        function Listing(element) {
            var that = this,
                mls,
                images,
                address,
                price,
                toolbar

                ;

            function init() {
                that.injectTools();
                that.injectLeftSidebar();
                that.injectRightSidebar();
                that.injectToolbar();
            }

            this.getElement = function() {
                return element;
            };

            this.getMls = function() {
                var mlsCell
                    ;

                if(mls || mls === false) {
                    return mls;
                }

                mlsCell = element.find('th').filter(function() {
                    var $this = $(this),
                        content = $.trim($this.text())
                        ;
                    if(content === 'MLS#:') {
                        return true;
                    }
                }).first().next();

                if(mlsCell.length) {
                    mls = mlsCell.text().trim();
                    if(!mls) {
                        mls = false;
                    }
                } else {
                    mls = false;
                }
                return mls;
            }

            this.getImages = function() {
                var baseImage
                    ;
                if($.isArray(images)) {
                    return images;
                }

                images = [];
                if(this.getMls()) {
                    baseImage = element.find('img[id=pic' + this.getMls() + ']')
                    if(baseImage.length) {
                        images.push(baseImage.attr('src'));
                        if(baseImage.get(0)._pixArray) {
                            $.each(baseImage.get(0)._pixArray, function(i, img) {
                                if(img == 'noLongerNeeded') return;
                                images.push(img);
                            });
                        }
                    }
                }

//                if(this.getAddress()) {
//                    images.push(that.getMapImageSrc());
//                    images.push(that.getStreetViewImageSrc());
//                }

                return images;
            }

            this.getMapImageSrc = function() {
                if(this.getAddress()) {
                    return 'http://maps.googleapis.com/maps/api/staticmap?zoom=15&size=400x300&sensor=false&markers=' + encodeURI(this.getAddress());
                }
                return false;
            }

            this.getStreetViewImageSrc = function() {
                if(this.getAddress()) {
                    return 'http://maps.googleapis.com/maps/api/streetview?size=400x300&sensor=false&fov=120&location=' + encodeURI(this.getAddress());
                }
                return false;
            }


            this.getAddress = function() {
                var addressCell
                    ;

                if(address || address === false) {
                    return address;
                }

                addressCell = element.find('font:eq(0)');

                if(addressCell.length) {
                    address = addressCell.text().trim() + ', Toronto, ON';
                    if(!address) {
                        address = false;
                    }
                } else {
                    address = false;
                }
                return address;
            }

            this.getPrice = function() {
                var priceCell
                    ;

                if(price || price === false) {
                    return price;
                }

                priceCell = element.find('font:eq(1)');

                if(priceCell.length) {
                    price = priceCell.text().replace(/For\s+Sale/i, '').trim();
                    if(!price) {
                        price = false;
                    }
                } else {
                    price = false;
                }
                return price;
            }


            this.getFrameVariables = function(name) {
                switch(name) {
                    case 'image':
                        return { images: this.getImages() };
                    case 'map':
                        return { address: this.getAddress() };
                }
            }

            this.bindFrameEvents = function(frameElement) {
                frameElement.bind('show', that.onShowFrame)
                             .bind('hide', that.onHideFrame)
                      ;
                switch(frameElement.data('name')) {
                    case 'image':
                        frameElement.bind('opened', that.onImageFrameOpened)
                        frameElement.bind('closed', that.onImageFrameClosed)
                        break;
                    case 'map':
                        console.log('Binding map-frame element', frameElement);
                        frameElement.bind('opened', that.onMapFrameOpened);
                        break;

                }
            }

            this.hasFrame = function(name) {
                return typeof this.getElement().data(name + 'Frame') !== 'undefined';
            }

            this.getFrame = function(name) {
                var frameElement,
                    domObject,
                    frameName = name + 'Frame';

                if(!that.hasFrame(name)) {
                    frameElement = $(templates[frameName]( this.getFrameVariables(name) ));
                    frameElement.hide()
                                 .data('name', name);
                    that.bindFrameEvents(frameElement);

                    console.log('Initializing new frame…');
                    that.initFrame(frameElement);
                    console.log('Initialized.');

                    domObject = frameElement.get(0);

                    element.get(0).parentNode.insertBefore(domObject, element.get(0));
                    element.data(frameName, $(domObject));
                }
                return element.data(frameName);
            }

            this.getToolbar = function() {
                return this.getComponent('toolbar');
            };

            this.getTools = function() {
                return this.getComponent('tools');
            };

            this.getLeftSidebar = function() {
                return this.getComponent('leftSidebar');
            };

            this.getRightSidebar = function() {
                return this.getComponent('rightSidebar');
            };

            this.getComponentVars = function(name) {
                switch(name) {
                    case 'tools':
                        return {
                            width: this.getElement().outerWidth() + 'px'
                        };
                    break;
                    case 'toolbar':
                        return {
                            mls: this.getMls(),
                            address: this.getAddress(),
                            price: this.getPrice(),
                            imageCount: this.getImages().length
                        };
                        break;
                    case 'leftSidebar':
                        return {
                            streetViewSrc: that.getStreetViewImageSrc()
                        };
                        break;
                    case 'rightSidebar':
                        return {
                            mapSrc: that.getMapImageSrc()
                        }
                        break;
                }
            };

            this.getComponent = function(name) {
                var component,
                    componentName = 'component-' + name;
                if(!element.data(componentName)) {
                    //console.log('Rendering ' + name + ' componet with vars', this.getComponentVars(name));
                    component = $(templates[name](this.getComponentVars(name)));
                    element.data(componentName, component);
                }
                return element.data(componentName);
            };

            this.getImagesList = function() {
                return this.getImageFrame().find('.images');
            };

            this.injectTools = function() {
                this.getElement().before(that.getTools());
            };

            this.injectLeftSidebar = function() {
                var sidebar = that.getLeftSidebar();
                sidebar.hide();
                this.getTools().prepend(sidebar);
                sidebar.find('img').on('load', function() {
                    sidebar.fadeIn();
                });
            };

            this.injectRightSidebar = function() {
                var sidebar = that.getRightSidebar();
                sidebar.hide();
                this.getTools().prepend(sidebar);
                sidebar.find('img').on('load', function() {
                    sidebar.fadeIn();
                });
            };

            this.injectToolbar = function() {
                var toolbar = this.getToolbar();

                toolbar.hide();

                this.getTools().append(toolbar);

                toolbar.fadeIn();

                toolbar.find('.btn.next').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.changeImage('+');
                });
                toolbar.find('.btn.previous').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.changeImage('-');
                });
                toolbar.find('.btn.zoom-in').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.changeZoom('+');
                });
                toolbar.find('.btn.zoom-out').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.changeZoom('-');
                });
                toolbar.find('.btn.zoom-reset').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.changeZoom(0);
                });
                toolbar.find('.btn.show-frame').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    var button = $(this);
                    that.toggleFrame(button.data('frame'));
                });

            }

            this.updateImagePositionLabel = function() {
                var list = this.getImagesList(),
                    images = this.getImages(),
                    label = this.getToolbar().find('.image-position .current'),
                    current = list.data('current') || 0;

                if(images.length == 0) {
                    label.text(0);
                } else {
                    label.text(current + 1);
                }
            }

            this.toggleFrame = function(name) {
                if(this.getFrame(name).is(':hidden')) {
                    this.showFrame(name);
                } else {
                    this.hideFrame(name);
                }
            }
            this.toggleImageFrame = function() {
                that.toggleFrame('image');
            }

            this.toggleMapFrame = function(name) {
                that.toggleFrame('map');
            }

            this.initFrame = function(frameElement) {
                var method = frameElement.data('name') + 'FrameInit';
                this[method](frameElement);
            }

            this.imageFrameInit = function(frameElement) {
                frameElement.find('.images .image').not(':first').hide();
            }

            this.fixMapHeight = function(frameElement) {
                var body = $('body'),
                    windowHeight = body.data('windowHeight');
                console.log('Fixing map height');
                frameElement.css({height: (window.innerHeight - 70 - that.getToolbar().height()) + 'px' });
                google.maps.event.trigger(frameElement.find('.map').data('map'), "resize");

            }

            this.geocodeLocation = function(callback) {
                console.log('Geocoding address: ' + that.getAddress());
                geocoder.geocode({ 'address': that.getAddress()}, function (results, status) {
                    console.log('Geocode Returned', status);
                    if (status == google.maps.GeocoderStatus.OK) {
                        that.getElement().data('geocodedLocation', results[0].geometry.location).trigger('geocoded');
                    } else if(status == "OVER_QUERY_LIMIT") {
                        console.log('Over query limit. Requeuing with delay.');
                        setTimeout(function() {
                            that.geocodeLocation(callback);
                        }, 2000);
                        return;
                    } else {
                        that.getElement().data('geocodedLocation', -1);
                    }
                    callback();
                });
            };

            this.initMap = function (container, callback) {
                that.geocodeLocation(function() {
                    var geoLocation = that.getElement().data('geocodedLocation')
                    if (geoLocation == -1) {
                        container.html("Geocode was not successful");
                    } else {
                        var mapOptions = {
                                center: geoLocation,
                                zoom: 15,
                                mapTypeId: google.maps.MapTypeId.ROADMAP
                            },
                            map = new google.maps.Map(container.get(0), mapOptions),
                            marker = new google.maps.Marker({
                                map: map,
                                position: geoLocation,
                                title: that.getAddress()
                            });

                        container.data({ 'map': map, 'mapOptions': mapOptions });
                        console.log('Map frame initialized');
                    }
                    callback();
                })
            };

            this.mapFrameInit = function (frameElement) {
                console.log('Initializing new map frame…');

                var mapContainer = frameElement.find('.map');

                $('body').on('window-resize', function() {
                    that.fixMapHeight(frameElement);
                });

                fx.queue(function(next) {
                    that.initMap(mapContainer, next);
                }).queue(function(next) {
                    if(mapContainer.data('map')) {
                        that.fixMapHeight(frameElement);
                    }
                    next();
                });

            }

            this.toggleStreetView = function() {
                var frameElement = this.getFrame('map'),
                    hidden = that.getMapFrame().is(':hidden')
                    ;

                that.showMapFrame();

                fx.queue(function(next) {
                    var mapContainer = frameElement.find('.map'),
                        map = mapContainer.data('map'),
                        mapOptions = mapContainer.data('mapOptions')
                        ;
                    console.log('Toggling Street View');

                    map.getStreetView().setOptions({
                        position: mapOptions.center,
                        visible: hidden ? true : !map.getStreetView().getVisible()
                    });
                    next();
                });
            }

            this.onMapFrameOpened = function (event) {
                var frameElement = $(this),
                    mapContainer = frameElement.find('.map'),
                    map = mapContainer.data('map');

                console.log('Map Frame Opened');
                if(mapContainer.data('map')) {
                    google.maps.event.trigger(map, "resize");
                    map.setOptions(mapContainer.data('mapOptions'));
                }
            };

            this.onImageFrameOpened = function(event) {
                that.getToolbar().find('.image-count').fadeOut(function() {
                    that.updateImagePositionLabel();
                    that.getToolbar().find('.image-position').fadeIn();
                })
            }

            this.onImageFrameClosed = function(event) {
                that.getToolbar().find('.image-position').fadeOut(function() {
                    that.getToolbar().find('.image-count').fadeIn();
                })
            }

            this.onShowFrame = function(event) {
                var frameElement = $(this);
                if(frameElement.is(':visible')) return;

                console.log('Showing ' + frameElement.data('name') + ' frame', frameElement);
                fx.queue(function(next) {
                    //frameElement.data('matte', $('<div class="matte"></div>').css('display', 'none'));
                    //$('body').append(frameElement.data('matte'));
                    //frameElement.data('matte').fadeIn();

                    frameElement.slideDown('fast', function() {
                        that.getToolbar().find('.btn.show-frame[data-frame=' + frameElement.data('name') + ']').addClass('active');
                        frameElement.trigger('opened');
                        next()
                    });
                });
            }

            this.onHideFrame = function(event) {
                var frame = $(this);
                if(frame.is(':hidden')) return;
                fx.queue(function(next) {
                    //var matte = frame.data('matte');

                    //matte.fadeOut(function() {
                    //    matte.remove();
                    //});

                    frame.slideUp('fast', function() {
                        that.getToolbar().find('.btn.show-frame[data-frame=' + frame.data('name') + ']').removeClass('active');
                        frame.trigger('closed');
                        next();
                    });
                });
            }

            this.showFrame  = function(name) {
                var frameElement = this.getFrame(name);

                // Close any other frames
                $('.frame').not(frameElement).trigger('hide');
                if(!that.isActivated()) {
                    that.activate();
                }
                frameElement.trigger('show');

            }

            this.hideFrame = function(name) {
                this.getFrame(name).trigger('hide');
            }

            this.getImageFrame = function() {
                return that.getFrame('image');
            }

            this.getMapFrame = function() {
                return that.getFrame('map');
            }

            this.showImageFrame = function() {
                return that.showFrame('image');
            }

            this.showMapFrame = function() {
                return that.showFrame('map');
            }

            this.hideImageFrame = function() {
                return that.showFrame('image');
            }

            this.hideMapFrame = function() {
                return that.showFrame('map');
            }

            this.changeZoom = function(direction) {
                var list = this.getImagesList(),
                    images = list.find('.image'),
                    current, zoom;

                if(that.getImageFrame().is(':hidden')) {
                    // First time the frame's been opened, so we
                    // ignore the change directive
                    this.showImageFrame();
                    return;
                }
                current = list.data('zoom') || 0;

                if(direction == '+') {
                    current++;
                } else if (direction == '-') {
                    current--;
                } else if (direction == 0) {
                    current = 0;
                }

                zoom = (1+(0.25* current));

                console.debug('New Zoom: ' + zoom);

                list.data('zoom', current);
                images.each(function() {
                    var image = $(this),
                        img = image.find('img'),
                        imgCurrentWidth,
                        imgBaseWidth,
                        hidden = false;
                        ;
                    if(image.is(':hidden')) {
                        // image needs to be visible to calculate width properly
                        hidden = true;
                        image.css({ position: 'absolute', left: image.parent().width() * 10 }).show();
                    }

                    imgCurrentWidth = img.width();
                    imgBaseWidth = img.css({ width: '' }).width();
                    img.css({ width: imgCurrentWidth + 'px'});

                    fx.queue(function(next) {
                        if(hidden) {
                            img.css({ width: imgBaseWidth * zoom });
                            next();
                        } else {
                            img.animate({ width: imgBaseWidth * zoom }, 'fast', function() {
                                next();
                            });
                        }
                    });
                    if(hidden) {
                        hidden = true;
                        image.hide().css({ position: '', left: ''});
                    }

                })
            }

            this.changeImage = function(direction) {
                var list = this.getImagesList(),
                    images = list.find('.image'),
                    current, next, looping = false;

                // if no frames are open...
                if(this.getImageFrame().is(':hidden') && this.getMapFrame().is(':hidden')) {
                    // First time the frame's been opened, so we
                    // ignore the change directive
                    this.showImageFrame();
                    return;
                } else if (this.getMapFrame().is(':visible')) {
                    // Do nothing when maps are open
                    return;
                }

                current = list.data('current') || 0;

                if(!current && current !== 0) {
                    list.data('current', 0);
                    return;
                }

                next = current + (direction == '-' ? -1 : 1);

                if(next < 0) {
                    next = images.length - 1;
                    looping = true;
                }
                if(next > images.length - 1) {
                    next = 0;
                    looping = true;
                }

                console.log('Next: ' + next);

                if(looping) {
                    list.find('.image:visible').effect('shake', { direction: direction == '+' ? 'left' : 'right', times: 1, distance: 3 }, 100);
                }

                fx.queue(function(nextFn) {
                    list.find('.image:visible').hide(
                        'drop',
                        { direction: (direction == '+' ? 'left' : 'right'), distance: 200 },
                        'fast',
                        function() {
                            list.find('.image:eq(' + next + ')').show(
                                'drop',
                                { direction: (direction == '+' ? 'right' : 'left'), distance: 200 },
                                'fast',
                                function() {
                                    nextFn()
                                });
                        });
                });


                list.data('current', next);
                this.updateImagePositionLabel();

            }

            this.isActivated = function() {
                return that.getTools().hasClass('active');
            }

            this.getScrollPosition = function() {
                var tools = that.getTools();
                return tools.position().top - listingScrollPadding;
            }

            this.isInPosition = function() {
                var body = $('body')
                    ;
                return (body.scrollTop() == that.getScrollPosition());
            }

            this.activate = function (autoScroll) {
                var body = $('body'),
                    tools = that.getTools();

                autoScroll = typeof autoScroll !== 'undefined' ? autoScroll : true;

                if(!that.isActivated()) {
                    tools.removeClass('active');
                    tools.addClass('active');
                }

                body.data('current', $(listings).index(that));
                if(autoScroll) {
                    fx.queue(function (next) {
                        body.data('activating', true)
                            .animate({ scrollTop: that.getScrollPosition(), easing: 'linear'}, 'fast', function() {
                                body.data('activating', false);
                                next();
                            });
                    });
                    }
                return that;
            }

            init();

        }

        this.main = function() {
            $('body').data('toMlsImprovements', that);
            that.injectStyles();
            $(function() {
                $('body > table table[width="650"][border="1"]').each(that.improveListing);
                that.bindHotkeys();
                that.bindScroll();
                that.initSidebarSizing();
            });
        };

        this.initSidebarSizing = function () {
            $(window).on('resize', function () {
                var body = $('body');
                if (body.data('sidebarResizeTimeout')) {
                    clearTimeout(body.data('sidebarResizeTimeout'));
                }
                body.data('sidebarResizeTimeout', setTimeout(function () {
                    that.resizeSidebars();
                    body.removeData('sidebarResizeTimeout');
                }, 1000));
            });

            that.resizeSidebars();
        };

        this.setGoogle = function(googleInstance) {
            console.log('Setting google instances');
            google = googleInstance;
            geocoder = new google.maps.Geocoder();
        };

        this.bindScroll = function() {
            $(document).scroll(function() {
                var body = $('body');

                if(body.data('activating')) {
                    return;
                }

                $.each(listings, function() {
                    var listing = this,
                        tools = listing.getTools(),
                        top = tools.position().top
                        ;
                    if(top > body.scrollTop()
                        && top < body.scrollTop() + (window.innerHeight / 4)) {
                        if(!listing.isActivated()) {
                            listing.activate(false);
                        }
                        return false;
                    }
                })
            }).triggerHandler('scroll');
        }

        this.bindHotkeys = function() {
            $(document).on('keyup', function(e) {
                if(!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    switch(e.which) {
                        case 'J'.charCodeAt(0):
                            that.changeListing('+');
                            break;
                        case 'K'.charCodeAt(0):
                            that.changeListing('-');
                            break;
                        case 39: // ? Key
                        case 'N'.charCodeAt(0):
                            that.changeImage('+');
                            break;
                        case 37: // ? Key
                        case 'P'.charCodeAt(0):
                            that.changeImage('-');
                            break;
                        case 'G'.charCodeAt(0):
                            that.openGuava();
                            break;
                        case 'M'.charCodeAt(0):
                            that.toggleFrame('map');
                            break;
                        case 'S'.charCodeAt(0):
                            that.toggleStreetView();
                            break;
                        case 'I'.charCodeAt(0):
                            that.toggleFrame('image');
                            break;
                        case 189:
                        case '-'.charCodeAt(0):
                            that.changeZoom('-');
                            break;
                        case '0'.charCodeAt(0):
                            that.changeZoom(0);
                            break;
                        case 27: // Esc
                            that.hideFrame('image');
                            that.hideFrame('map');
                            break;
                    }
                } else if (e.shiftKey && !e.ctrlKey && !e.metaKey) {
                    switch(e.which) {
                        case 107:
                        case 187:
                        case 61:
                            // + Key in all browsers
                            that.changeZoom('+');
                            break;
                        case 'M'.charCodeAt(0):
                            that.openMap();
                            break;

                    }
                }
            });
        }



        this.getCurrentListing = function() {
            var body = $('body'),
                current = body.data('current') || 0
                ;

            if(current !== body.data('current')) {
                body.data('current', current);
            }

            return listings[current];
        }

        this.openLink = function(anchor) {
            var el = $(anchor);

            window.open(el.attr('href'));
        }

        this.openMap = function() {
            var listing = this.getCurrentListing();
            if(!listing) return;

            that.openLink(listing.getToolbar().find('a.btn.map'));
        }

        this.openGuava = function() {
            var listing = this.getCurrentListing();
            if(!listing) return;

            that.openLink(listing.getToolbar().find('a.btn.search-guava'));
        }

        this.toggleFrame = function(name) {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.toggleFrame(name);
        }

        this.toggleStreetView = function() {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.toggleStreetView();
        }

        this.hideFrame = function(name) {
            var body = $('body'),
                current = body.data('current'),
                listing;

            if(!current && current !== 0) {
                // No active listing, do nothing
                return;
            }

            listing = this.getCurrentListing();
            if(!listing) return;

            if(!listing.hasFrame(name)) {
                // Nothing to do here
                return;
            }
            console.log('Hiding frame ' + name, current);

            listing.hideFrame(name);
        }

        this.changeImage = function(direction) {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.changeImage(direction);
        }

        this.changeZoom = function(direction) {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.changeZoom(direction);
        }

        this.changeListing = function(direction) {
            var body = $('body'),
                current = body.data('current'),
                next = current || 0,
                currentListing = that.getCurrentListing(),
                listing
                ;
            console.log('Changing listing', {current: current, direction: direction});
            if (direction == '+') {
                // Move to next listing if current one is in place
                // otherwise we'll just properly position the current
                // listing
                if(currentListing.isInPosition()) {
                   next++;
                }
            } else if(direction == '-') {
                if(!next && next !== 0) {
                    // Nothing to do here
                    return;
                }
                next--;
            }
            console.log('next: ' + next);

            if (next > listings.length - 1) {
                next = listings.length - 1;
            }
            if (next < 0) {
                next = 0;
            }

            if(!listings[next]) {
                return;
            }

            if(next !== current) {
                // Before we activate the next listing, close any current frames
                this.hideFrame('image');
                this.hideFrame('map');
            }

            listings[next].activate();
            body.data('current', next);
        }

        this.injectStyles = function() {
            $('head').append($(templates.style()));
            $('head').append($('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/smoothness/jquery-ui.css />'));
        };

        this.improveListing = function() {
            var listing = new Listing($(this));

            listings.push(listing);
        };

        this.resizeSidebars = function() {
            console.log('Resizing sidebars…')
            var lefts = $('.tools .sidebar.left'),
                rights = $('.tools .sidebar.right'),
                space = ( $(window).width() - $('.tools').first().width() ) / 2,
                width = space >= 420 ? 400 : space - 20,
                offset = (-1 * width) - ((space - width) / 2);

            console.log('Sidebar space: ' + space);
            lefts.css({ width: width, left: offset });
            rights.css({ width: width, right: offset });
        }

    }(jQuery);

    toMlsImprovements.main();
}

// load jQuery and execute the main function
addJQuery(main);