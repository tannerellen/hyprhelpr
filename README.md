# HyprHelpr
A useful tool for Hyprland to make common tasks easier. Create custom menus, toggle apps in a special workspace, magnify your screen with zoom, and set wallpapers easily with Hyprpaper.

## Installation and Usage
Download the latest release, unzip and copy the app into any folder in your $PATH like /usr/local/bin/
Alternatively you can launch the app from any directory by specifying the path to it's location like ~/MyApps/hyprhelpr

To use hyprhelpr you specify the module and any parameters. You can read about each module below but it looks like this
```
hyprhelpr [MODULE] [ARGUMENT] [ARGUMENT]
```

Here are some real world examples
```
hyprhelpr menu | fuzzel --dmenu
```
```
hyprhelpr toggle pavucontrol
```
```
hyprhelpr zoom 0.5
```
```
hyprhelpr wallpaper set ~/Pictures/Wallpapers/MyImage.jpg
```

## Modules

### Menu
The menu module is used to create menu functionality in any dmenu based app. This allows for easy custom menus in things like rofi, fuzzel, and walker. Menus can be multiple levels deep. 

Outputs a list of menu items that can be piped into any dmenu compatible launcher. The only usage of this module is
```
hyprhelpr menu
```

### Toggle
Toggle allows easy setup to toggle apps in hyprland's special workspaces. This works great to quickly show an app and then hide it. Especially usefull for things like interacting with notes, calculator, music players or any other app that you want quick access to but doesn't need to be on screen all the time.

Usage:
```
hyprhelper toggle <name specified in config>
```

### Zoom
Zoom in on your cursor position. Can be animated or instant. If no zoom amount is specified it will toggle between the zoom amount specified in the config and not zoomed at all.

Usage:
```
hyprhelper zoom <optional zoom change amount>
```

### Wallpaper
Set a random wallpaper or specific one from a directory. Can set a specific wallpaper if a path is specified or set a random wallpaper if no path is specified. List will list all wallpapers in the directory specified in the config. Useful for passing wallpapers to dmenu.

Requires:
[Hyprpaper](https://wiki.hyprland.org/Hypr-Ecosystem/hyprpaper/)

Usage:
```
hyprhelper wallpaper <operation (set or list)> <optional wallpaper path>
```

## Config
**Save a json formatted config file to: ~/.config/hyprhelpr/config.json**

### Sample Config:

```JSON
{
  "zoom": {
    "default": 0.5,
    "animate": true,
    "duration": 0.2,
    "fps": 60
  },
  "wallpaper": {
    "directory": "~/Wallpapers"
  },
  "toggle": {
    "entries": [
      {
        "name": "term-calc",
        "command": "kitty --class term-calc -e kalc",
        "size": "30% 40%"
      },
      {
        "name": "term-notes",
        "command": "kitty --class term-notes -e nvim -c 'cd ~/Documents/Notes/Tanner/'",
        "size": "80% 80%"
      },
      {
        "name": "pavucontrol",
        "command": "pavucontrol",
        "size": "40% 80%"
      },
      {
        "name": "gedit",
        "command": "flatpak run org.gnome.gedit --class gedit-toggle",
        "processMatch": "^gedit --class gedit-toggle",
        "size": "60% 80%"
      }
    ]
  },
  "menu": {
    "command": "walker --dmenu --keepsort",
    "entries": [
      {
        "label": "Connect To Server",
        "command": "walker -m ssh",
        "next": []
      },
      {
        "label": "Color Picker",
        "command": "",
        "next": [
          {
            "label": "Hex",
            "command": "hyprpicker --format hex | wl-copy"
          },
          {
            "label": "RGB",
            "command": "hyprpicker --format rgb | wl-copy"
          }
        ]
      },
      {
        "label": "Set Wallpaper",
        "command": "bun run hyprhelpr wallpaper set \"$(hyprhelpr wallpaper list | walker --dmenu --keepsort)\"",
        "next": []
      }
    ]
  }
}

```

## Run From Source
To run the source code directly clone this repo, navigate to the directory then:

Install bun (or use your favorite package manager):
```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies:
```bash
bun install
```

To run a module -- substitute hyprhelpr for bun run index.js:

```bash
bun run index.js wallpaper set
```

[Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
