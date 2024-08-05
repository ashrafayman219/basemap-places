var displayMap;
let view;

function loadModule(moduleName) {
  return new Promise((resolve, reject) => {
    require([moduleName], (module) => {
      if (module) {
        resolve(module);
      } else {
        reject(new Error(`Module not found: ${moduleName}`));
      }
    }, (error) => {
      reject(error);
    });
  });
}

async function initializeMapPlaces() {
  try {
    const [
      esriConfig,
      Map,
      MapView,
      VectorTileLayer,
      Basemap,
      BasemapStyle,
      promiseUtils,
      places,
      FetchPlaceParameters,
      PlacesQueryParameters,
      Expand,
      FeatureLayer,
      Graphic,
      LayerList,
      reactiveUtils
    ] = await Promise.all([
      loadModule("esri/config"),
      loadModule("esri/Map"),
      loadModule("esri/views/MapView"),
      loadModule("esri/layers/VectorTileLayer"),
      loadModule("esri/Basemap"),
      loadModule("esri/support/BasemapStyle"),
      loadModule("esri/core/promiseUtils"),
      loadModule("esri/rest/places"),
      loadModule("esri/rest/support/FetchPlaceParameters"),
      loadModule("esri/rest/support/PlacesQueryParameters"),
      loadModule("esri/widgets/Expand"),
      loadModule("esri/layers/FeatureLayer"),
      loadModule("esri/Graphic"),
      loadModule("esri/widgets/LayerList"),
      loadModule("esri/core/reactiveUtils"),
    ]);

    const apiKey =
      "AAPK756f006de03e44d28710cb446c8dedb4rkQyhmzX6upFiYPzQT0HNQNMJ5qPyO1TnPDSPXT4EAM_DlQSj20ShRD7vyKa7a1H";
    // "AAPT3NKHt6i2urmWtqOuugvr9fHQ610Hqjyi5sds6bqAsnn9I-YR8MGrGmBIRaTBa0YRIe6Q4TbO0Sxpbe0Hdpoq-cXhYuFZXwcne0v5zx12HSRAOwhgvge7TMi_ZeLwy0_essF_3BYl9EcFg2u2VbHWLwg74lLnugEmYKQwsaLZ1Qnz98LrXNRwnhTCVdiGf-Hv8o5u4UDOxmVy-CcWWDQuo3eP_MsyG1cM7zkbSmitszo.";
    esriConfig.apiKey = apiKey;

    // Display places with the basemap style.
    const basemap = new Basemap({
      style: new BasemapStyle({
        id: "arcgis/navigation",
        places: "attributed", // returns the place's esri_place_id
      }),
    });

    const renderer = {
      type: "heatmap",
      colorStops: [
        { color: [133, 193, 200, 0], ratio: 0 },
        { color: [133, 193, 200, 0], ratio: 0.01 },
        { color: [133, 193, 200, 255], ratio: 0.01 },
        { color: [133, 193, 200, 255], ratio: 0.01 },
        { color: [144, 161, 190, 255], ratio: 0.0925 },
        { color: [156, 129, 132, 255], ratio: 0.175 },
        { color: [167, 97, 170, 255], ratio: 0.2575 },
        { color: [175, 73, 128, 255], ratio: 0.34 },
        { color: [184, 48, 85, 255], ratio: 0.4225 },
        { color: [192, 24, 42, 255], ratio: 0.505 },
        { color: [200, 0, 0, 255], ratio: 0.5875 },
        { color: [211, 51, 0, 255], ratio: 0.67 },
        { color: [222, 102, 0, 255], ratio: 0.7525},
        { color: [233, 153, 0, 255], ratio: 0.835},
        { color: [244, 204, 0, 255], ratio: 0.9175},
        { color: [255, 255, 0, 255], ratio: 1 }
      ],
      maxDensity: 0.01,
      minDensity: 0
    };

    // Create featurelayer from feature service
    const checkinLayer = new FeatureLayer({
      // URL to the service
      url: "https://services3.arcgis.com/AtFD5NjBs72VpMjN/arcgis/rest/services/checkin/FeatureServer/0",
      renderer: renderer,
    });

    displayMap = new Map({
      basemap: basemap,
      layers: [checkinLayer]
    });


    view = new MapView({
      container: "viewDiv",
      map: displayMap,
      center: [-118.49178, 34.01185],
      zoom: 15,
      constraints: {
        minScale: 72223.81928607849,
      },
    });

    // try {
    //   const featureLayers = await createFeatureLayers(geojsons);
    //   // now we have the featureslayers
    // } catch (error) {
    //   // here if not found
    // }

    await view.when();

    // let alert = document.getElementById('alertConfirmation');
    // view.ui.add(alert);
    // alert.style.display = "none";

    // get the places layer from the basemap
    const layer = displayMap.allLayers.getItemAt(0);

    let vtlTooltip = createTooltip();
    let pointerMoveHandle = pointerMoveHandler();
    let pointerMoveHandle01 = pointerMoveHandler01();

    // Call hitTest from pointer-move to get place features from the places vector tile layer
    function pointerMoveHandler() {
      return view.on("pointer-move", async (event) => {
        let hits;
        try {
          hits = await hitTest(event);
          let displayContent;
          if (hits) {
            displayContent = `Name: ${hits[0].attributes["_name"]}`;
            vtlTooltip.show(hits.screenPoint, displayContent);
          } else {
            vtlTooltip.hide();
          }
        } catch {}
      });
    }

    let alert = document.createElement("calcite-alert");

    function creatingAlertConfirmation(placeName) {
      alert.remove();
      alert = document.createElement("calcite-alert");
      alert.kind = "info";
      alert.open = true;
      alert.icon = "register";
      alert.setAttribute("auto-close", "true");
      let divTitle = document.createElement("div");
      let divMessage = document.createElement("div");
      divTitle.slot = "title";
      divTitle.innerHTML = `You have checked in in the ${placeName}`;
      divMessage.slot = "message";
      divMessage.innerHTML = `Your check-in is successfully saved ${placeName}`;
      alert.append(divTitle);
      alert.append(divMessage);
      view.ui.add(alert);
    }


    // Call hitTest from pointer-click to get place features from the places vector tile layer
    function pointerMoveHandler01() {
      return view.on("click", async (event) => {
        let hits;

        try {
          hits = await hitTest(event);
          let placeName;
          if (hits) {
            console.log(hits, "hitsss");
            
            let attributes = {};
            attributes["Name"] = hits[0].attributes["_name"];
            let geo = hits[0].geometry;
            const addFeature =  new Graphic({
              geometry: geo,
              attributes: attributes
            });
            console.log("ppp");
            
            checkinLayer.applyEdits({
              addFeatures: [addFeature]
            })


            placeName = hits[0].attributes["_name"];
            // vtlTooltip.show(hits.screenPoint, displayContent);
            creatingAlertConfirmation(placeName);
            view.goTo(
              {
                target: hits[0],
                zoom: 20,
              },
              {
                duration: 2000,
              }
            );
            // alert.style.display = "block";
          } else {
            // vtlTooltip.hide();
            alert.remove();
            view.goTo(
              {
                target: view.center,
                zoom: 15,
              },
              {
                duration: 2000,
              }
            );
          }
        } catch {}
      });
    }

    view.when().then(() => {
      // When the view is ready, clone the heatmap renderer
      // from the only layer in the web map

      // for (let i = 0; i < view.map.layers.length; i++) {
        const heatmapRenderer = checkinLayer.renderer.clone();

        // The following simple renderer will render all points as simple
        // markers at certain scales
        const simpleRenderer = {
          type: "simple",
          symbol: {
            type: "picture-marker",  // autocasts as new PictureMarkerSymbol()
            url: "https://daraobeirne.github.io/kisspng-drawing-pin-world-map-logo-push-vector-5ae029f6ddeaf4.198342921524640246909.png",
            width: "30px",
            height: "30px"
          }
        };

        // When the scale is larger than 1:72,224 (zoomed in passed that scale),
        // then switch from a heatmap renderer to a simple renderer. When zoomed
        // out beyond that scale, switch back to the heatmap renderer
        reactiveUtils.watch(
          () => view.scale,
          (scale) => {
            checkinLayer.renderer = scale <= 2224 ? simpleRenderer : heatmapRenderer;
          }
        );
      // }

    });


    let searchedPlaceId, displayContent;
    const tooltipDiv = document.getElementById("vtlTooltip");
    tooltipDiv.addEventListener("click", () => {
      tooltipDiv.style["pointer-events"] = "none";
      pointerMoveHandle = pointerMoveHandler();
      vtlTooltip.hide();
    });

    view.on("key-down", (event) => {
      if (event.key === "Escape") {
        tooltipDiv.style["pointer-events"] = "none";
        pointerMoveHandle = pointerMoveHandler();
        vtlTooltip.hide();
      }
    });

    // // open the place of interest's website when user clicks on POI
    // view.on("click", async (event) => {
    //   hits = await hitTest(event);
    //   console.log(hits, "hits");
    //   if (hits && hits[0].attributes["esri_place_id"] !== searchedPlaceId) {
    //     // remove the pointer move event handler
    //     pointerMoveHandle.remove();
    //     tooltipDiv.style["pointer-events"] = "auto";
    //     // user clicked on a feature once, get additional info about the place using the placeId
    //     const placeResult = await getPlace(
    //       hoverGraphic.attributes["esri_place_id"]
    //     );

    //     // searchedPlaceId is used to check if user is clicking on same feature
    //     searchedPlaceId = placeResult.placeId;

    //     // create a content to display containing the place info
    //     const address = [
    //       placeResult?.address?.streetAddress,
    //       placeResult?.address?.locality,
    //       placeResult?.address?.postcode,
    //     ]
    //       .filter(Boolean)
    //       .join(", ");

    //     const phone = [placeResult?.contactInfo?.telephone]
    //       .filter(Boolean)
    //       .join(", ");
    //     const link = [placeResult?.contactInfo?.website]
    //       .filter(Boolean)
    //       .join(", ");
    //     displayContent = "Name: " + hoverGraphic.attributes["_name"];

    //     for (const [index, string] of [address, phone, link].entries()) {
    //       if (string !== null && string.length > 0) {
    //         if (index == 0) {
    //           displayContent += "<br> Address: " + string;
    //         } else if (index == 1) {
    //           displayContent += "<br> Phone: " + string;
    //         } else {
    //           displayContent +=
    //             "<br> Website: <a target='_blank' href='" +
    //             string +
    //             "'>" +
    //             string +
    //             "</a>";
    //         }
    //       }
    //     }
    //     vtlTooltip.show({ x: event.x, y: event.y }, displayContent);
    //   } else if (
    //     hits &&
    //     hits[0]?.attributes["esri_place_id"] == searchedPlaceId
    //   ) {
    //     pointerMoveHandle.remove();
    //     tooltipDiv.style["pointer-events"] = "auto";
    //     vtlTooltip.show({ x: event.x, y: event.y }, displayContent);
    //   } else {
    //     vtlTooltip.hide();
    //   }
    // });

    let hoverGraphic;
    // debounce the hittest as user moves the mouse over the map to improve performance
    const hitTest = await promiseUtils.debounce(async (event) => {
      // get hit test results only from the vector tile layer
      const hit = await view.hitTest(event, { include: layer });
      const mapPoint = view.toMap({ x: event.x, y: event.y });
      if (hit.results.length) {
        // check if the hittest result contains graphics from places vector tile layer
        const placesHitTestResult = await Promise.all(
          hit?.results
            ?.filter((result) => {
              if (result.graphic.attributes["esri_place_id"]) {
                // console.log(result, "result");
                return result.graphic;
              }
            })
            .map(async (filterResult) => {
              // console.log(filterResult, "filterResult");
              if (filterResult) {
                if (
                  hoverGraphic?.attributes["esri_place_id"] ===
                  filterResult.graphic.attributes["esri_place_id"]
                ) {
                  return hoverGraphic;
                } else {
                  hoverGraphic = filterResult.graphic.clone();
                  return filterResult.graphic;
                }
              }
            })
        );

        placesHitTestResult.screenPoint = hit.screenPoint;
        if (!placesHitTestResult.length) {
          return null;
        }
        return placesHitTestResult;
      } else {
        return null;
      }
    });

    let a =
      "AAPTxy8BH1VEsoebNVZXo8HurNaPVpzNwxNjXziN3ZXyYKBltEO3h8eMkPkBmDhn7fxOky96vDmpSnQG6eWRqGzn1R4EcMDeNtBNQGY7dyA7_1dsObaY3WFjUjDGOhwqfM0DbIH4p6OZ1t_BeEovXpEXcqKLhZYPQFpttQPoyMx7vzsxLp-ZPQ2idkCjIjZGqfwOOieyJ7chTdlcntGgakspTk7B0w6LCI3a8rtrf78icSQ.AT1_DpnC2Lf9";

    // This function is called from as user moves the mouse over the places features
    // Fetches additional info about the place from the places API to be displayed in a tooltip
    async function getPlace(placeId) {
      const fetchPlaceParameters = new FetchPlaceParameters({
        // a,
        placeId,
        requestedFields: ["all"],
      });

      // Get the additional info about the place using the placeID
      const fetchPlaceResult = await places.fetchPlace(fetchPlaceParameters);
      const placeDetails = fetchPlaceResult.placeDetails;
      return placeDetails;
    }

    // create and set up tool tip to show the labels from vector tile layer
    // as user moves the pointer over the map
    function createTooltip() {
      const tooltip = document.createElement("div");
      tooltip.id = "vtlTooltip";
      const style = tooltip.style;
      tooltip.setAttribute("role", "tooltip");
      tooltip.classList.add("tooltip");
      const textElement = document.createElement("div");
      textElement.classList.add("esri-widget");
      tooltip.appendChild(textElement);
      view.container.appendChild(tooltip);
      let x = 0,
        y = 0;
      let targetX = 0,
        targetY = 0;
      let visible = false;
      // move the tooltip progressively
      function move() {
        x += (targetX - x) * 0.1;
        y += (targetY - y) * 0.1;
        if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
          x = targetX;
          y = targetY;
        } else {
          requestAnimationFrame(move);
        }
        style.transform =
          "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
      }
      return {
        show: (point, text) => {
          if (!visible) {
            x = point.x;
            y = point.y;
          }
          targetX = point.x;
          targetY = point.y;
          style.opacity = 1;
          visible = true;
          textElement.innerHTML = text;
          move();
        },
        hide: () => {
          style.opacity = 0;
          visible = false;
        },
      };
    }

    // Displays instructions to the user for understanding the sample
    // And places them in an Expand widget instance
    const sampleInstructions = document.createElement("div");
    sampleInstructions.style.padding = "10px";
    sampleInstructions.style.backgroundColor = "white";
    sampleInstructions.style.width = "300px";
    sampleInstructions.innerHTML = [
      "<b>Move</b> the pointer over the points of interest",
      "to see the place name.",
      "<b>Click</b> the POI to access its address, phone # and website.",
      "<b>Click</b> the provided link to visit the website of the place.",
      "<b>Press Escape</b> to resume exploring other places.",
    ].join(" ");

    const instructionsExpand = new Expand({
      expandIcon: "question",
      expandTooltip: "How to use this sample",
      expanded: true,
      view: view,
      content: sampleInstructions,
    });
    view.ui.add(instructionsExpand, "top-left");
    setTimeout(() => {
      instructionsExpand.expanded = false;
    }, 5000);




    //add widgets
    await addWidgets()
      .then(([view, displayMap]) => {
        console.log("Widgets Returned From Require Scope", view, displayMap);
        // You can work with the view object here
      })
      .catch((error) => {
        // Handle any errors here
      });

    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}

window.onload = initializeMapPlaces;

async function addWidgets() {
  try {
    // await initializeMap();

    const [
      Fullscreen,
      BasemapGallery,
      Expand,
      ScaleBar,
      AreaMeasurement2D,
      Search,
      Home,
      LayerList,
      BasemapToggle,
    ] = await Promise.all([
      loadModule("esri/widgets/Fullscreen"),
      loadModule("esri/widgets/BasemapGallery"),
      loadModule("esri/widgets/Expand"),
      loadModule("esri/widgets/ScaleBar"),
      loadModule("esri/widgets/AreaMeasurement2D"),
      loadModule("esri/widgets/Search"),
      loadModule("esri/widgets/Home"),
      loadModule("esri/widgets/LayerList"),
      loadModule("esri/widgets/BasemapToggle"),
    ]);

    // var basemapGallery = new BasemapGallery({
    //   view: view,
    // });

    // var Expand22 = new Expand({
    //   view: view,
    //   content: basemapGallery,
    //   expandIcon: "basemap",
    //   group: "top-right",
    //   // expanded: false,
    //   expandTooltip: "Open Basmap Gallery",
    //   collapseTooltip: "Close",
    // });
    // view.ui.add([Expand22], { position: "top-right", index: 6 });

    // 1 - Create the widget
    const toggle = new BasemapToggle({
      // 2 - Set properties
      view: view, // view that provides access to the map's 'topo-vector' basemap
      nextBasemap: "hybrid", // allows for toggling to the 'hybrid' basemap
    });
    // Add widget to the top right corner of the view
    view.ui.add(toggle, "top-right");

    // var fullscreen = new Fullscreen({
    //   view: view,
    // });
    // view.ui.add(fullscreen, "top-right");

    // var scalebar = new ScaleBar({
    //   view: view,
    //   unit: "metric",
    // });
    // view.ui.add(scalebar, "bottom-right");

    var search = new Search({
      //Add Search widget
      view: view,
    });
    view.ui.add(search, { position: "top-left", index: 0 }); //Add to the map

    var homeWidget = new Home({
      view: view,
    });
    view.ui.add(homeWidget, "top-left");

    var layerList = new LayerList({
      view: view,
      listItemCreatedFunction: function (event) {
        var item = event.item;
        // displays the legend for each layer list item
        item.panel = {
          content: "legend",
        };
      },
      showLegend: true,
    });

    layerList.visibilityAppearance = "checkbox";
    var Expand5 = new Expand({
      view: view,
      content: layerList,
      expandIcon: "layers",
      group: "top-right",
      // expanded: false,
      expandTooltip: "Layer List",
      collapseTooltip: "Close",
    });
    Expand5.expanded = true;
    view.ui.add([Expand5], { position: "top-left", index: 6 });


    await view.when();

    return [view, displayMap]; // You can return the view object
  } catch (error) {
    console.error("Error initializing map:", error);
    throw error; // Rethrow the error to handle it further, if needed
  }
}
