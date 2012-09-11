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
    toMlsImprovements = new function(jQuery) {
        var that = this,
            $ = jQuery,
            listings = [],
            fx = $({}),
            google,
            geocoder,
            listingScrollPadding = 20,
            templates = {
                'style': function() {
                    return '' +
                        '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/twitter-bootstrap/2.0.4/css/bootstrap-combined.min.css" /> ' +
                        '<style>' +
                        '   .toolbar {' +
                        '       display: block;' +
                        '       background-color: #e7f3ff;' +
                        '       border: 1px solid #909090;' +
                        '       border-bottom: none;' +
                        '       border-radius: 3px 3px 0 0;' +
                        '       position: relative;' +
                        '   }' +
                        '   .toolbar.active {' +
                        '       background-color: #f3ffe7;' +
                        '   }' +
                        '   .toolbar .contents {' +
                        '       padding: 6px 5px;' +
                        '       text-align: center;' +
                        '       margin: 0;' +
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
                        '   .window {' +
                        '       position: absolute;' +
                        '       left: 0; right: 0;' +
                        '       margin-top: 1px;' +
                        '       z-index: 1000;' +
                        '       overflow: hidden;' +
                        '   }' +
                        '   .image-window .images {' +
                        '       overflow: hidden;' +
                        '   }' +
                        '   .image-window .image img {' +
                        '       height: auto;' +
                        '   }' +
                        '   .map-window .map {' +
                        '       width: 80%;' +
                        '       height: 600px;' +
                        '   }' +
                        '   .map-window .map img {' +
                        '       max-width: none;' +
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
                'toolbar': function(vars) {
                    return '' +
                        '<div class="toolbar" style="width: '+ vars.width +';">' +
                        '   <div class="contents cf btn-toolbar">' +
                        '       <div class="pull-right right">' +
                        '           <div class="btn-group image-toggle">' +
                        '               <span class="btn btn-mini show-window" data-window="image"><i class="icon-picture"></i></span>' +
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
                        '               <a class="btn btn-mini show-window map" data-window="map" target="_blank" href="https://maps.google.com/?q=' + encodeURI(vars.address) + '"><i class="icon-map-marker"></i></a>' +
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
                        '</div>'
                },
                'imageWindow': function(vars) {
                    var tpl = '';
                    tpl += '' +
                        '<div class="image-window window">' +
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
                'mapWindow': function(vars) {
                    return '' +
                        '<div class="map-window window">' +
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
                that.injectToolbar()
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

                if(this.getAddress()) {
                    images.push('http://maps.googleapis.com/maps/api/staticmap?zoom=13&size=400x300&sensor=false&markers=' + encodeURI(this.getAddress()));
                    images.push('http://maps.googleapis.com/maps/api/streetview?size=400x300&sensor=false&fov=120&location=' + encodeURI(this.getAddress()));
                }

                return images;
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


            this.getWindowVariables = function(name) {
                switch(name) {
                    case 'image':
                        return { images: this.getImages() };
                    case 'map':
                        return { address: this.getAddress() };
                }
            }

            this.bindWindowEvents = function(windowElement) {
                windowElement.bind('show', that.onShowWindow)
                             .bind('hide', that.onHideWindow)
                      ;
                switch(windowElement.data('name')) {
                    case 'image':
                        windowElement.bind('opened', that.onImageWindowOpened)
                        windowElement.bind('closed', that.onImageWindowClosed)
                        break;
                    case 'map':
                        console.log('Binding map-window element', windowElement);
                        windowElement.bind('opened', that.onMapWindowOpened);
                        break;

                }
            }

            this.hasWindow = function(name) {
                return typeof this.getElement().data(name + 'Window') !== 'undefined';
            }

            this.getWindow = function(name) {
                var windowElement,
                    domObject,
                    windowName = name + 'Window';

                if(!that.hasWindow(name)) {
                    windowElement = $(templates[windowName]( this.getWindowVariables(name) ));
                    windowElement.hide()
                                 .data('name', name);
                    that.bindWindowEvents(windowElement);

                    console.log('Initializing new window...');
                    that.initWindow(windowElement);
                    console.log('Initialized.');

                    domObject = windowElement.get(0);

                    element.get(0).parentNode.insertBefore(domObject, element.get(0));
                    element.data(windowName, $(domObject));
                }
                return element.data(windowName);
            }

            this.getToolbar = function() {
                var toolbar;
                if(!element.data('toolbar')) {
                    toolbar = $(templates.toolbar({
                        width: this.getElement().width() + 'px',
                        mls: this.getMls(),
                        address: this.getAddress(),
                        price: this.getPrice(),
                        imageCount: this.getImages().length
                    }));
                    element.data('toolbar', toolbar);
                }
                return element.data('toolbar');
            }

            this.getImagesList = function() {
                return this.getImageWindow().find('.images');
            }

            this.injectToolbar = function() {
                var toolbar = this.getToolbar();

                this.getElement().before(toolbar);

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
                toolbar.find('.btn.show-window').bind('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.toggleWindow($(this).data('window'));
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

            this.toggleWindow = function(name) {
                if(this.getWindow(name).is(':hidden')) {
                    this.showWindow(name);
                } else {
                    this.hideWindow(name);
                }
            }
            this.toggleImageWindow = function() {
                that.toggleWindow('image');
            }

            this.toggleMapWindow = function(name) {
                that.toggleWindow('map');
            }

            this.initWindow = function(windowElement) {
                var method = windowElement.data('name') + 'WindowInit';
                this[method](windowElement);
            }

            this.imageWindowInit = function(windowElement) {
                windowElement.find('.images .image').not(':first').hide();
            }

            this.fixMapHeight = function(windowElement) {
                var body = $('body'),
                    windowHeight = body.data('windowHeight');
                console.log('Fixing map height');
                windowElement.css({height: (window.innerHeight - 70 - that.getToolbar().height()) + 'px' });
                google.maps.event.trigger(windowElement.data('map'), "resize");

            }

            this.mapWindowInit = function (windowElement) {
                console.log('Initializing Map Window');

                $('body').on('window-resize', function() {
                    that.fixMapHeight(windowElement);
                });

                fx.queue(function(next) {
                    geocoder.geocode( { 'address': that.getAddress()}, function(results, status) {
                        console.log('Geocode Returned');
                        if (status == google.maps.GeocoderStatus.OK) {
                                var container = windowElement.find('.map'),
                                mapOptions = {
                                    center: results[0].geometry.location,
                                    zoom:15,
                                    mapTypeId:google.maps.MapTypeId.ROADMAP
                                },
                                map = new google.maps.Map(container.get(0),mapOptions);
                                var marker = new google.maps.Marker({
                                    map: map,
                                    position: results[0].geometry.location,
                                    title: that.getAddress()
                                });

                                windowElement.data({ 'map': map, 'mapOptions': mapOptions });
                                that.fixMapHeight(windowElement);

                        } else {
                            container.html("Geocode was not successful for the following reason: " + status);
                        }
                        console.log('Map window initialized');
                        next();
                    });
                })
            }

            this.toggleStreetView = function() {
                var windowElement = this.getWindow('map'),
                    hidden = that.getMapWindow().is(':hidden')
                    ;

                that.showMapWindow();

                fx.queue(function(next) {
                    var map = windowElement.data('map'),
                        mapOptions = windowElement.data('mapOptions')
                        ;
                    console.log('Toggling Street View');

                    map.getStreetView().setOptions({
                        position: mapOptions.center,
                        visible: hidden ? true : !map.getStreetView().getVisible()
                    });
                    next();
                });
            }

            this.onMapWindowOpened = function (event) {
                var windowElement = $(this),
                    map = windowElement.data('map');

                console.log('Map Window Opened');
                google.maps.event.trigger(map, "resize");
                map.setOptions(windowElement.data('mapOptions'));

            }

            this.onImageWindowOpened = function(event) {
                that.getToolbar().find('.image-count').fadeOut(function() {
                    that.updateImagePositionLabel();
                    that.getToolbar().find('.image-position').fadeIn();
                })
            }

            this.onImageWindowClosed = function(event) {
                that.getToolbar().find('.image-position').fadeOut(function() {
                    that.getToolbar().find('.image-count').fadeIn();
                })
            }

            this.onShowWindow = function(event) {
                var windowElement = $(this);
                if(windowElement.is(':visible')) return;
                console.log('Showing ' + windowElement.data('name') + ' window');
                fx.queue(function(next) {
                    windowElement.slideDown('fast', function() {
                        that.getToolbar().find('.btn.show-window[data-window=' + windowElement.data('name') + ']').addClass('active');
                        windowElement.trigger('opened');
                        next()
                    });
                });
            }

            this.onHideWindow = function(event) {
                var window = $(this);
                if(window.is(':hidden')) return;
                fx.queue(function(next) {
                    window.slideUp('fast', function() {
                        that.getToolbar().find('.btn.show-window[data-window=' + window.data('name') + ']').removeClass('active');
                        window.trigger('closed');
                        next();
                    });
                });
            }

            this.showWindow  = function(name) {
                var windowElement = this.getWindow(name);

                // Close any other windows
                $('.window').not(windowElement).trigger('hide');
                if(!that.isActivated()) {
                    that.activate();
                }
                windowElement.trigger('show');

            }

            this.hideWindow = function(name) {
                this.getWindow(name).trigger('hide');
            }

            this.getImageWindow = function() {
                return that.getWindow('image');
            }

            this.getMapWindow = function() {
                return that.getWindow('map');
            }

            this.showImageWindow = function() {
                return that.showWindow('image');
            }

            this.showMapWindow = function() {
                return that.showWindow('map');
            }

            this.hideImageWindow = function() {
                return that.showWindow('image');
            }

            this.hideMapWindow = function() {
                return that.showWindow('map');
            }

            this.changeZoom = function(direction) {
                var list = this.getImagesList(),
                    images = list.find('.image'),
                    current, zoom;

                if(that.getImageWindow().is(':hidden')) {
                    // First time the window's been opened, so we
                    // ignore the change directive
                    this.showImageWindow();
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
                    images = list.find('.image');

                // if no windows are open...
                if(this.getImageWindow().is(':hidden') && this.getMapWindow().is(':hidden')) {
                    // First time the window's been opened, so we
                    // ignore the change directive
                    this.showImageWindow();
                    return;
                } else if (this.getMapWindow().is(':visible')) {
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
                }
                if(next > images.length - 1) {
                    next = 0;
                }
                console.log('Next: ' + next);
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
                return that.getToolbar().hasClass('active');
            }

            this.getScrollPosition = function() {
                var toolbar = that.getToolbar();
                return toolbar.position().top - listingScrollPadding;
            }

            this.isInPosition = function() {
                var body = $('body')
                    ;
                return (body.scrollTop() == that.getScrollPosition());
            }

            this.activate = function (autoScroll) {
                var body = $('body'),
                    toolbar = that.getToolbar();

                autoScroll = typeof autoScroll !== 'undefined' ? autoScroll : true;

                if(!that.isActivated()) {
                    $('.toolbar').removeClass('active');
                    toolbar.addClass('active');
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
            that.injectStyles();
            $('body > table table[width="650"][border="1"]').each(that.improveListing);
            that.bindHotkeys();
            that.bindScroll();
            $('body').data('toMlsImprovements', that);
        }

        this.setGoogle = function(googleInstance) {
            google = googleInstance;
            geocoder = new google.maps.Geocoder();
        }

        this.bindScroll = function() {
            $(document).scroll(function() {
                var body = $('body');

                if(body.data('activating')) {
                    return;
                }

                $.each(listings, function() {
                    var listing = this,
                        toolbar = listing.getToolbar(),
                        top = toolbar.position().top
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
                        case 39: // → Key
                        case 'N'.charCodeAt(0):
                            that.changeImage('+');
                            break;
                        case 37: // ← Key
                        case 'P'.charCodeAt(0):
                            that.changeImage('-');
                            break;
                        case 'G'.charCodeAt(0):
                            that.openGuava();
                            break;
                        case 'M'.charCodeAt(0):
                            that.toggleWindow('map');
                            break;
                        case 'S'.charCodeAt(0):
                            that.toggleStreetView();
                            break;
                        case 'I'.charCodeAt(0):
                            that.toggleWindow('image');
                            break;
                        case 189:
                        case '-'.charCodeAt(0):
                            that.changeZoom('-');
                            break;
                        case '0'.charCodeAt(0):
                            that.changeZoom(0);
                            break;
                        case 27: // Esc
                            that.hideWindow('image');
                            that.hideWindow('map');
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

        this.toggleWindow = function(name) {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.toggleWindow(name);
        }

        this.toggleStreetView = function() {
            var listing = this.getCurrentListing();
            if(!listing) return;

            listing.toggleStreetView();
        }

        this.hideWindow = function(name) {
            var body = $('body'),
                current = body.data('current'),
                listing;

            if(!current && current !== 0) {
                // No active listing, do nothing
                return;
            }

            listing = this.getCurrentListing();
            if(!listing) return;

            if(!listing.hasWindow(name)) {
                // Nothing to do here
                return;
            }
            console.log('Hiding window ' + name, current);

            listing.hideWindow(name);
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
                // Before we activate the next listing, close any current windows
                this.hideWindow('image');
                this.hideWindow('map');
            }

            listings[next].activate();
            body.data('current', next);
        }

        this.injectStyles = function() {
            $('head').append($('<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/smoothness/jquery-ui.css />'));
            $('head').append($(templates.style()));
        }

        this.improveListing = function() {
            var listing = new Listing($(this));

            listings.push(listing);

        }

    }(jQuery);

    toMlsImprovements.main();
}

// load jQuery and execute the main function
addJQuery(main);