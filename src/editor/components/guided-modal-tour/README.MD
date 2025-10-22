# How to create new tours

## 1. Create a unique tourID for the tour

Let's say the tourId is `interaction-library`

## 2. Add the GuidedModalTour component

Add the GuidedModalTour component to where we want to show the tour. This tour
will be visible only once when the component is rendered.

For example in `interaction-library` tour, we can add it in the actual interaction library
modal render:

```js
<GuidedModalTour tourId="interaction-library" />
```

## 3. Add initialization code to trigger the tour if needed

Since the `GuidedModalTour` component is only rendered when the tour is actually
shown, if we are coming from the Getting Started screen, and we want to force
the tour to open and need to perform any code for this, then we can add them in:

`src/editor/components/guided-modal-tour/index.js`

## 4. Add the show condition for the tour

By default, `GuidedModalTour` only shows once. When it's finished, it will not
show again. We can change this behavior e.g. stop the tour from showing, by
adding a condition in `./tour-conditions.js`.

## 5. Create the tour steps

Create the tour steps in `src/editor/components/modal-tour/tours/`, refer to
`src/editor/components/modal-tour/tours/README.md` for more details

