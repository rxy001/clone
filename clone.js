import {
  objectCreate,
  nativeGetSymbols,
  isArray,
  hasOwnProperty,
  propertyIsEnumerable,
  getPrototype,
  eq,
  isObject,
  isFunction,
  getTag,
  keys,
  getAllKeys,
  isMap,
  isSet
} from './utils.js'
import {
  objectTag,
  argumentTag,
  booleanTag,
  dateTag,
  mapTag,
  setTag,
  numberTag,
  stringTag,
  regexpTag,
  symbolTag
} from './tags.js'
import ListCache from './list-cache.js'

export default function clone(value, deep, stack) {
  const isDeep = deep || false
  let result = null
  if (!isObject(value) || isFunction(value)) {
    return value
  }
  const isArr = isArray(value)
  if (isArr) {
    result = initCloneArray(value)
    if (!isDeep) {
      return copyArray(value, result)
    }
  } else {
    const tag = getTag(value)
    if (tag === objectTag || tag === argumentTag) {
      result = initCloneObject(value)
      if (!isDeep) {
        return copySymbols(value, baseAssign(result, value))
      }
    } else {
      result = initCloneByTag(value, tag) // 不考虑WeakMap WeakSet
    }
  }

  // stack 解决循环引用
  stack || (stack = new ListCache())

  const stacked = stack.get(value)

  // 将之前存储的爷辈的对象返回, 赋值给父辈的对象属性，因此在修改爷辈的对象时候，会修改父辈属性的变化，
  // 例如此循环引用的对象{b:{a:{b:{...}}}};  var a = {};var b = {}; a.b=b; b.a=a可创建;
  // 在第一次clone调用时 ， value1 = {b:{a:{b:{...}}}}; result1 = {} stack.data = [[value1, result1]]
  // 第二次 value2 = {a:{b:{...}}} result2 = {} stack.data=[value1, result1], [value2, result2]]
  // 第三次 value3 = {b:{a:{b:{...}}}}, 此时 value3 === value1, 将其对应数组中的result1返回，
  // 因此，回到第二次调用 result2 = {a: result1}
  // 回到第一次调用 result1 = {b: result2}，到此形成循环引用
  if (stacked) return stacked
  stack.set(value, result)

  if (isSet(value)) {
    value.forEach(subValue => {
      result.add(clone(subValue, isDeep, stack))
    })
    return result
  }

  if (isMap(value)) {
    value.forEach((subValue, key) => {
      result.set(key, clone(subValue, isDeep, stack))
    })
    return result
  }

  const props = isArr ? void 666 : getAllKeys(value)
  ;(props || value).map((subValue, key) => {
    if (props) {
      key = subValue
      subValue = value[subValue]
    }
    assignValue(result, key, clone(subValue, isDeep, stack))
  })

  return result
}

function initCloneArray(array) {
  const result = new array.constructor()
  const length = array.length

  // Regexp.exec()   // 数组的length不包括数字之外的属性
  if (
    length &&
    typeof array[0] === 'string' &&
    hasOwnProperty.call(array, 'index')
  ) {
    result.index = array.index
    result.input = array.input
    result.groups = array.groups
  }
  return result
}

function copyArray(value, array) {
  let i = -1
  let length = value.length

  array || (array = Array(length))
  while (++i < length) {
    array[i] = value[i]
  }
  return array
}

function initCloneObject(object) {
  return typeof object.constructor === 'function'
    ? baseCreate(getPrototype(object))
    : {}
}

const baseCreate = (function() {
  function object() {}
  return function(proto) {
    if (!isObject(proto)) {
      return {}
    }
    if (objectCreate) {
      return objectCreate(proto)
    }
    object.prototype = proto
    const result = new object()
    object.prototype = void 2333
    return result
  }
})()

function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object)
}

function copyObject(source, props, object) {
  const isNew = !object
  object || (object = {})

  let index = -1
  while (++index < props.length) {
    const key = props[index]
    const value = source[key]
    if (isNew) {
      baseAssignValue(object, key, value)
    } else {
      assignValue(object, key, value)
    }
  }

  return object
}

function baseAssignValue(object, key, value) {
  // __proto__无法通过.或者[]修改其值
  if (key == '__proto__' && defineProperty) {
    defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      value: value,
      writable: true
    })
  } else {
    object[key] = value
  }
}

function assignValue(object, key, value) {
  const objValue = object[key]
  if (!(hasOwnProperty.call(object, key) && eq(objValue, value))) {
    baseAssignValue(object, key, value)
  }
}

function copySymbols(source, object) {
  return copyObject(source, getSymbols(source), object)
}

function getSymbols(object) {
  if (object != null && nativeGetSymbols) {
    return nativeGetSymbols(object).filter(v =>
      propertyIsEnumerable.call(object, v)
    )
  } else {
    return []
  }
}

function cloneSymbol(symbol) {
  return Symbol.prototype.valueOf
    ? Object(Symbol.prototype.valueOf.call(symbol))
    : {}
}

function cloneRegExp(regexp) {
  // regexp.source 正则源文本
  // regexp.source es6新增 正则修饰符 例如： g i

  // 具体查看 http://es6.ruanyifeng.com/#docs/regex#%E5%AD%97%E7%AC%A6%E4%B8%B2%E7%9A%84%E6%AD%A3%E5%88%99%E6%96%B9%E6%B3%95
  const result = new regexp.constructor(regexp.source, regexp.flags)
  result.lastIndex = regexp.lastIndex
  return result
}

function initCloneByTag(object, tag) {
  const Ctor = object.constructor
  switch (tag) {
    // +Boolean(true) true ,   +Boolean(false) true
    case booleanTag:
    // +new Date 会将对象转换成时间戳
    case dateTag:
      return new Ctor(+object)
    case mapTag:
    case setTag:
      return new Ctor()
    case numberTag:
    case stringTag:
      return new Ctor(object)

    //  稍后再看
    case regexpTag:
      return cloneRegExp(object)
    case symbolTag:
      return cloneSymbol(object)
  }
}
