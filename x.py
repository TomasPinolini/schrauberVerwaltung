import base64
import struct

# Your data
angle_b64 = "AfhXVAH4V1QB+Fs8AfhbPAH4CygB+AsoAfe6sAH3urAB94UsAfeFLAH3hSwB94UsAfeFLAH3hSwB94UsAfeFLAH3gagB94GoAfeBqAH3gagB94GoAferdAH3q3QB99WkAffVpAH3/3AB9/9wAfgpoAH4KaAB+FPQAfh5tAH4o+QB+M4UAfjOFAH49+AB+PfgAfkiEAH5S9wB+UvcAfl2DAH5dgwB+aA8AfmgPAH5yggB+coIAfn0OAH6HgQB+h4EAfpINAH6cgAB+pwwAfqcMAH6xmAB+vAsAfrwLAH7GlwB+xpcAftEKAH7blgB+5iIAfvCVAH7wlQB++yEAfwWUAH8QIAB/GqwAfyUfAH8lHwB/L6sAfy+rAH86HgB/Oh4Af0SqAH9EqgB/Tx0Af1mpAH9ZqQB/ZDUAf26oAH9uqAB/eTQAf3k0AH+DpwB/g6cAf44zAH+YvwB/mL8Af6MyAH+tvgB/rb4Af7KHAH+yhwB/socAf6f7AH+n+wB/nW8Af51vAH+S/AB/kvwAf4hwAH+IcAB/ff0Af339AH9zcQB/c3EAf2j+AH9o/gB/XnIAf15yAH9aowB/WqMAf1qjAH9QFwB/RaQAfzsYAH8wjAB/JhkAfxuNAH8RGgB/Bo4AfvwbAH7xjwB+7roAfu66AH7sxgB+7MYAfu3AA=="
torque_b64 = "AJiWgACYvZAAmVnQAIyvoAA3//AANsdwABFlIAAQLKAABhqAAAXzcAAFzGAABaVQAAV+QAAFVzAABTAgAATiAAAEk+AABGzQAARFwAAEHrAABaVQABvscAAdJPAANxWQADh1IABWhHAAV7zwAG2O4ABueUAAhVygAJi9kACd7bAAoXAgAKG+QAClZ8AApbXgAKjqMACr93AArGygAK+g8ACvyAAAstVAALMjYAC2fsAAtqXQALoBMAC9g6AAvdHAAMF7QADE1qAAyDIAAMhZEADL24AAz13wAM+FAADTVZAA06OwANb/EADaqJAA3qAwAOH7kADiSbAA5hpAAOnq0ADt4nAA8bMAAPWDkAD10bAA+S0QAPl7MAD9JLAA/UvAAQBZAAEAzjABBOzgAQn18AEKuUABDtfwARHlMAERviABFH1AARTLYAEYJsABGE3QARupMAEh6sABIjjgASSC0AEnaQABJ94wASmy8AEpZNABDyYQAMQ6YAC+bgAAhh/wAIRyQABia1AAYOSwAEmMIABIerAANMugADO6MAAi8VAAIi4AABLEsAAR2lAABLrwAARFwAALSqAAC5jAAAl14AAATiAAAAAAAAAAAAAAAAAAAAAAAAAAAP//2PD//7Hg//8VoP/+K0D//Y8A//1n8P/9GdAAAAAA//+x4A=="
angle_scale = 10000
torque_scale = 100000

# Decode and unpack data
def decode_b64_to_scaled_floats(b64_data, scale):
    raw = base64.b64decode(b64_data)
    values = struct.unpack('<' + 'h' * (len(raw) // 2), raw)
    return [v / scale for v in values]

# Apply decoding
angle_vals = decode_b64_to_scaled_floats(angle_b64, angle_scale)
torque_vals = decode_b64_to_scaled_floats(torque_b64, torque_scale)

# Show first 10 values as example
print("Angle (rad):", angle_vals[:10])
print("Torque (Nm):", torque_vals[:10])
