import os
import os.path, time
import string
import json
import shutil
import PIL
from optparse import OptionParser
from datetime import datetime
from PIL import Image, ImageOps, ImageFont, ImageDraw

def generate_original_icon(source):
    image = Image.open(source)
    image.save("../chrome/icon.png", "PNG")
    return image

def generate_base_icon(source, version, icon_type):
    image = Image.open(source)
    w,h = image.size

    font = ImageFont.truetype("Roboto/Roboto-bold.ttf", 25)

    draw = ImageDraw.Draw(image)
    box = [(20, 40), (122, 74)]
    draw.rectangle(box, fill=(50, 50, 50))
    draw.text((25, 40), version, (255, 255, 255), font=font)
    draw = ImageDraw.Draw(image)

    image.save("../chrome/icon.png", "PNG")

    return image

    print "Generated icon %s %s %s %d %d" % (source, version, icon_type, w, h)

def generate_resized_icon(base_icon, width, height):
    new_image = base_icon.resize((width, height), PIL.Image.ANTIALIAS)
    new_image.save("../chrome/icon_" + str(width) + ".png")

def generate_icon(source, version, icon_type):
    if icon_type == "beta":
        base_icon = generate_base_icon(source, version, icon_type)
        generate_resized_icon(base_icon, 128, 128)
        generate_resized_icon(base_icon, 48, 48)
        generate_resized_icon(base_icon, 32, 32)
        generate_resized_icon(base_icon, 16, 16)
    else:
        base_icon = generate_original_icon(source)
        generate_resized_icon(base_icon, 128, 128)
        generate_resized_icon(base_icon, 48, 48)
        generate_resized_icon(base_icon, 32, 32)
        generate_resized_icon(base_icon, 16, 16)

    return True

def main():
    print "Attach a version number to Postman app icon"

    parser = OptionParser(usage="Usage: %prog [options] filename")
    parser.add_option("-s", "--source", dest="source", help="Source icon PNG file")
    parser.add_option("-v", "--version", dest="version", help="Version number")
    parser.add_option("-t", "--type", dest="type", help="alpha/beta/final")

    (options, args) = parser.parse_args()

    source = options.source
    version = options.version
    icon_type = options.type

    generate_icon(source, version, icon_type)


if __name__ == "__main__":
    main()