# 🌱 Spring Boot-Style Dependency Injection

## Overview

The BaseComponent system now provides automatic dependency injection similar to Spring Boot's `@Autowired` annotation. Components declare dependencies and receive them as injected properties.

## How It Works

### 1. Declare Dependencies (Like Spring Boot `@ComponentScan`)
```javascript
class MyComponent extends BaseComponent {
    getDependencies() {
        return ['SelectionManager', 'BadgeManager', 'DOM'];
    }
}
```

### 2. Dependencies Auto-Injected (Like Spring Boot `@Autowired`)
```javascript
class MyComponent extends BaseComponent {
    async initialize() {
        // 🌱 These are automatically available - guaranteed initialized!
        this.selectionManager.selectJobNumber(5);  // Injected as camelCase
        this.badgeManager.setMode('visible');       // Injected as camelCase  
        this.dom.sceneContainer.appendChild(div);   // Injected as camelCase
        
        // No more manual getters needed!
        // ❌ OLD: const sm = getSelectionManager();
        // ✅ NEW: this.selectionManager (already available)
    }
}
```

## Available Dependencies

| Dependency Name | Injected As | Type |
|----------------|-------------|------|
| `SelectionManager` | `this.selectionManager` | SelectionManager instance |
| `BadgeManager` | `this.badgeManager` | BadgeManager instance |
| `CardsController` | `this.cardsController` | CardsController instance |
| `ResumeListController` | `this.resumeListController` | ResumeListController instance |
| `Timeline` | `this.timeline` | Timeline composable |
| `DOM` | `this.dom` | DOM utilities object |

## Benefits

### ✅ **Type Safety & Guaranteed Availability**
```javascript
// Dependencies are guaranteed to be initialized before your initialize() method
async initialize() {
    this.selectionManager.selectJobNumber(5); // ✅ Always works - no timing issues
}
```

### ✅ **No Manual Coordination**
```javascript
// ❌ OLD WAY: Manual coordination
async initialize() {
    await initializationManager.waitForComponents(['SelectionManager']);
    const selectionManager = getSelectionManager();
    selectionManager.selectJobNumber(5);
}

// ✅ NEW WAY: Automatic injection
async initialize() {
    this.selectionManager.selectJobNumber(5); // Just works!
}
```

### ✅ **Clean Testing**
```javascript
// Easy to mock dependencies for testing
const mockSelectionManager = { selectJobNumber: jest.fn() };
component.selectionManager = mockSelectionManager;
```

### ✅ **Spring Boot Familiarity**
```java
// Spring Boot Java equivalent
@Component
public class MyService {
    @Autowired
    private UserRepository userRepository; // Auto-injected
    
    public void doSomething() {
        userRepository.save(user); // Just works!
    }
}
```

## Migration Guide

### Before (Manual Getters)
```javascript
class CardsController extends BaseComponent {
    async initialize() {
        // Manual dependency resolution
        const selectionManager = getSelectionManager();
        const badgeManager = getBadgeManager();
        
        selectionManager.addEventListener('change', this.handleChange);
        badgeManager.setMode('visible');
    }
}
```

### After (Auto-Injection)
```javascript
class CardsController extends BaseComponent {
    getDependencies() {
        return ['SelectionManager', 'BadgeManager']; // Declare what you need
    }
    
    async initialize() {
        // Dependencies automatically injected as properties
        this.selectionManager.addEventListener('change', this.handleChange);
        this.badgeManager.setMode('visible');
    }
}
```

## Error Handling

The system provides clear error messages for dependency issues:

```
❌ [MyComponent] Failed to inject dependency SelectionManager: 
   SelectionManager not initialized. Must be created by InitializationManager.

⚠️ [MyComponent] No injector defined for dependency: UnknownDependency
```

## Backward Compatibility

The old getter functions still work for non-BaseComponent code:
```javascript
// Still works for Vue components, utility functions, etc.
const selectionManager = getSelectionManager();
```