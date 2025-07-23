#!/usr/bin/env python3
"""
Generate dependency graph PNG from the Resume-Flock component analysis
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import networkx as nx
from matplotlib.patches import FancyBboxPatch
import numpy as np

def create_dependency_graph():
    """Create a visual dependency graph using matplotlib and networkx"""
    
    # Create directed graph
    G = nx.DiGraph()
    
    # Define nodes with their properties
    nodes = {
        # Level 0 - Foundation
        'SelectionManager': {'level': 0, 'priority': 'Highest', 'type': 'BaseComponent', 'color': '#e1f5fe'},
        'StateManager': {'level': 0, 'priority': 'Highest', 'type': 'Manual', 'color': '#e1f5fe'},
        'Timeline': {'level': 0, 'priority': 'High', 'type': 'Manual', 'color': '#e1f5fe'},
        
        # Level 1 - Core Services  
        'BadgeManager': {'level': 1, 'priority': 'High', 'type': 'BaseComponent', 'color': '#f3e5f5'},
        'LayoutToggle': {'level': 1, 'priority': 'High', 'type': 'Manual', 'color': '#f3e5f5'},
        'CardsController': {'level': 1, 'priority': 'High', 'type': 'BaseComponent', 'color': '#f3e5f5'},
        'BadgePositioner': {'level': 1, 'priority': 'Medium', 'type': 'BaseComponent', 'color': '#f3e5f5'},
        'ScenePlaneModule': {'level': 1, 'priority': 'Medium', 'type': 'BaseComponent', 'color': '#f3e5f5'},
        
        # Level 2 - Controllers
        'ResumeListController': {'level': 2, 'priority': 'Medium', 'type': 'BaseComponent', 'color': '#e8f5e8'},
        'Viewport': {'level': 2, 'priority': 'Medium', 'type': 'Manual', 'color': '#e8f5e8'},
        
        # Level 3 - Layout Systems
        'Layout': {'level': 3, 'priority': 'Medium', 'type': 'Manual', 'color': '#e8f5e8'},
        'ReactiveSystems': {'level': 3, 'priority': 'Medium', 'type': 'Manual', 'color': '#e8f5e8'},
        
        # Level 4 - Scene Systems
        'SceneSystems': {'level': 4, 'priority': 'Low', 'type': 'Manual', 'color': '#fff3e0'},
        'SkillBadges': {'level': 4, 'priority': 'Low', 'type': 'Vue Component', 'color': '#fff3e0'},
        'DebugPanel': {'level': 4, 'priority': 'Low', 'type': 'Manual', 'color': '#fff3e0'},
        
        # Level 5 - UI Components
        'ConnectionLines': {'level': 5, 'priority': 'Low', 'type': 'Vue Component', 'color': '#fff3e0'},
        
        # Vue Components (separate)
        'AppContent': {'level': 1, 'priority': 'Root', 'type': 'Vue Root', 'color': '#fce4ec'},
        'BadgeToggle': {'level': 1, 'priority': 'UI', 'type': 'Vue Component', 'color': '#fce4ec'},
        'ResumeContainer': {'level': 1, 'priority': 'UI', 'type': 'Vue Component', 'color': '#fce4ec'},
    }
    
    # Define edges (dependencies)
    edges = [
        # From Level 0
        ('StateManager', 'BadgeManager'),
        ('StateManager', 'LayoutToggle'),
        ('SelectionManager', 'CardsController'),
        ('SelectionManager', 'BadgePositioner'),
        ('SelectionManager', 'ScenePlaneModule'),
        ('SelectionManager', 'AppContent'),
        ('SelectionManager', 'BadgeToggle'),
        ('SelectionManager', 'ResumeContainer'),
        
        # From Level 1
        ('CardsController', 'ResumeListController'),
        ('CardsController', 'Viewport'),
        ('CardsController', 'SkillBadges'),
        ('CardsController', 'ConnectionLines'),
        ('BadgeManager', 'AppContent'),
        ('BadgeManager', 'BadgeToggle'),
        
        # From Level 2
        ('ResumeListController', 'Viewport'),
        ('Viewport', 'Layout'),
        ('Viewport', 'ReactiveSystems'),
        
        # From Level 3
        ('Layout', 'SceneSystems'),
        ('Layout', 'DebugPanel'),
        
        # From Level 4
        ('SkillBadges', 'ConnectionLines'),
    ]
    
    # Add nodes and edges to graph
    for node, attrs in nodes.items():
        G.add_node(node, **attrs)
    
    G.add_edges_from(edges)
    
    # Create the visualization
    plt.figure(figsize=(20, 14))
    
    # Calculate positions using hierarchical layout
    pos = {}
    level_counts = {}
    level_positions = {}
    
    # Count nodes per level
    for node, attrs in nodes.items():
        level = attrs['level']
        level_counts[level] = level_counts.get(level, 0) + 1
    
    # Calculate positions for each level
    for level in sorted(level_counts.keys()):
        count = level_counts[level]
        level_positions[level] = []
        for i in range(count):
            x = (i - (count - 1) / 2) * 2.5  # Spread nodes horizontally
            y = -level * 2.5  # Stack levels vertically
            level_positions[level].append((x, y))
    
    # Assign positions to nodes
    level_counters = {level: 0 for level in level_counts.keys()}
    for node, attrs in nodes.items():
        level = attrs['level']
        pos[node] = level_positions[level][level_counters[level]]
        level_counters[level] += 1
    
    # Draw the graph
    ax = plt.gca()
    
    # Draw edges first (so they appear behind nodes)
    nx.draw_networkx_edges(G, pos, edge_color='#666666', arrows=True, 
                          arrowsize=20, arrowstyle='->', width=1.5, alpha=0.7)
    
    # Draw nodes with custom styling
    for node, (x, y) in pos.items():
        attrs = nodes[node]
        color = attrs['color']
        
        # Create fancy box for each node
        bbox = FancyBboxPatch((x-0.8, y-0.3), 1.6, 0.6, 
                             boxstyle="round,pad=0.1", 
                             facecolor=color, 
                             edgecolor='#333333',
                             linewidth=1.5)
        ax.add_patch(bbox)
        
        # Add text
        plt.text(x, y+0.1, node, ha='center', va='center', 
                fontsize=9, fontweight='bold', wrap=True)
        plt.text(x, y-0.15, f"{attrs['priority']}", ha='center', va='center', 
                fontsize=7, style='italic', color='#555555')
        plt.text(x, y-0.25, f"{attrs['type']}", ha='center', va='center', 
                fontsize=6, color='#777777')
    
    # Add level labels
    level_labels = {
        0: "Level 0: Foundation",
        1: "Level 1: Core Services",
        2: "Level 2: Controllers", 
        3: "Level 3: Layout Systems",
        4: "Level 4: Scene Systems",
        5: "Level 5: UI Components"
    }
    
    for level, label in level_labels.items():
        if level in level_counts:
            plt.text(-8, -level * 2.5, label, ha='left', va='center', 
                    fontsize=12, fontweight='bold', 
                    bbox=dict(boxstyle="round,pad=0.3", facecolor='lightgray', alpha=0.7))
    
    # Customize the plot
    plt.title("Resume-Flock Component Dependency Graph", fontsize=18, fontweight='bold', pad=20)
    
    # Add legend
    legend_elements = [
        patches.Patch(color='#e1f5fe', label='Foundation (Level 0)'),
        patches.Patch(color='#f3e5f5', label='Core Services (Level 1)'),
        patches.Patch(color='#e8f5e8', label='Controllers (Level 2-3)'),
        patches.Patch(color='#fff3e0', label='UI Components (Level 4-5)'),
        patches.Patch(color='#fce4ec', label='Vue Components'),
    ]
    plt.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(1, 1))
    
    # Remove axes
    plt.axis('off')
    
    # Adjust layout
    plt.tight_layout()
    
    # Save as PNG
    plt.savefig('/Users/sbecker11/workspace-flock/resume-flock/dependency-graph.png', 
                dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
    
    print("✅ Dependency graph saved as 'dependency-graph.png'")
    plt.show()

def create_simple_tree_diagram():
    """Create a simpler tree-style diagram with smaller fonts"""
    fig, ax = plt.subplots(figsize=(14, 10))
    
    # Define the tree structure with shorter lines
    tree_data = """Resume-Flock Dependencies
│
├─ Level 0 (Foundation)
│  ├─ SelectionManager (★★★)
│  ├─ StateManager (★★★)
│  └─ Timeline (★★)
│
├─ Level 1 (Core Services)
│  ├─ BadgeManager → [StateManager] (★★)
│  ├─ LayoutToggle → [StateManager] (★★)
│  ├─ CardsController → [SelectionManager] (★★)
│  ├─ BadgePositioner → [SelectionManager] (★)
│  └─ ScenePlaneModule → [SelectionManager] (★)
│
├─ Level 2 (Controllers)
│  ├─ ResumeListController → [CardsController, SelectionManager] (★)
│  └─ Viewport → [CardsController, ResumeListController] (★)
│
├─ Level 3 (Layout Systems)
│  ├─ Layout → [Viewport, LayoutToggle] (★)
│  └─ ReactiveSystems → [Viewport] (★)
│
├─ Level 4 (Scene Systems)
│  ├─ SceneSystems → [Viewport, Layout] (★)
│  ├─ SkillBadges → [CardsController] (★)
│  └─ DebugPanel → [Viewport, Layout] (★)
│
├─ Level 5 (UI Components)
│  └─ ConnectionLines → [CardsController, SkillBadges] (★)
│
└─ Vue Components
   ├─ AppContent → [SelectionManager, BadgeManager]
   ├─ BadgeToggle → [BadgeManager, SelectionManager]
   └─ ResumeContainer → [SelectionManager]"""
    
    ax.text(0.02, 0.98, tree_data, transform=ax.transAxes, fontfamily='monospace',
            fontsize=7, verticalalignment='top', 
            bbox=dict(boxstyle="round,pad=0.5", facecolor='#f8f9fa', alpha=0.8))
    
    # Add priority legend with smaller font
    legend_text = """Priority Levels:
★★★ = Highest (First to init)
★★  = High
★   = Medium/Low

Component Types:
• BaseComponent (Auto-reg)
• Vue Component (Mixin)
• Manual Registration"""
    
    ax.text(0.72, 0.98, legend_text, transform=ax.transAxes, fontfamily='monospace',
            fontsize=6, verticalalignment='top',
            bbox=dict(boxstyle="round,pad=0.3", facecolor='#e3f2fd', alpha=0.8))
    
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    ax.set_title('Resume-Flock Dependency Tree', fontsize=12, fontweight='bold', pad=15)
    
    plt.tight_layout()
    plt.savefig('/Users/sbecker11/workspace-flock/resume-flock/dependency-tree.png', 
                dpi=300, bbox_inches='tight', facecolor='white')
    
    print("✅ Dependency tree saved as 'dependency-tree.png'")
    plt.show()

if __name__ == "__main__":
    print("🚀 Generating dependency tree visualization...")
    
    try:
        import matplotlib.pyplot as plt
        
        print("📋 Creating tree diagram...")
        create_simple_tree_diagram()
        
        print("\n✅ Tree visualization created successfully!")
        print("📁 File saved:")
        print("   • dependency-tree.png (Tree diagram)")
        print("   • dependency-graph.md (Source diagrams)")
        
    except ImportError as e:
        print(f"❌ Missing required library: {e}")
        print("📦 Install with: pip install matplotlib")
        
        # Provide alternative instructions
        print("\n🔄 Alternative methods to create PNG:")
        print("1. Use online Mermaid editor: https://mermaid.live/")
        print("2. Use Graphviz: 'dot -Tpng dependency-graph.dot -o graph.png'")
        print("3. Use PlantUML: 'plantuml dependency-graph.puml'")