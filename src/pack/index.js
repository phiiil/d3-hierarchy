import {packEnclose} from "./siblings";
import {optional} from "../accessors";
import constant, {constantZero} from "../constant";

function defaultRadius(d) {
  return Math.sqrt(d.value);
}

export default function() {
  var radius = null,
      dx = 1,
      dy = 1,
      padding = constantZero;

  /**
   * Main entry point for the Circle packing algo
   *   @param root: base of object hierachy to be displayed
   */
  function pack(root) {
    // calculate position of root as half of size
    root.x = dx / 2, root.y = dy / 2;
    if (radius) {
      root.eachBefore(radiusLeaf(radius))  // visit ancestors first
          .eachAfter(packChildren(padding, 0.5))  // visit children first
          .eachBefore(translateChild(1));  // visit ancestors first
    } else {
      root.eachBefore(radiusLeaf(defaultRadius))
          .eachAfter(packChildren(constantZero, 1))
          .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
          .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }

  pack.radius = function(x) {
    return arguments.length ? (radius = optional(x), pack) : radius;
  };

  pack.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };

  pack.padding = function(x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant(+x), pack) : padding;
  };

  return pack;
}

function radiusLeaf(radius) {
  return function(node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}

/**
 * Returns a function closure to pack children with a specific padding and scale
 *
 * @param padding: space between circles
 * @param k: scale to resize circles
 8 @return {function} Whether something occurred.
 */
function packChildren(padding, k) {
  return function(node) {
    if (children = node.children) {
      var children,
          i,
          n = children.length,
          r = padding(node) * k || 0,
          e;

      // Add scaled-padding to the radius all the children
      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      // execute the packing for siblings at the same level
      e = packEnclose(children);
      // Subtract scaled-padding to the radius all the children
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      // return the size of the enclosing circle (containing all children) + padding
      node.r = e + r;
    }
  };
}

/**
 * Returns a function closure to scale and translate a single children
 *     based on the position of the parent node.
 * @param k: scale to resize circles
 */
function translateChild(k) {
  return function(node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}
