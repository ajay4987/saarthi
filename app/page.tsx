"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, User } from "lucide-react"

interface Person {
  id: string
  name: string
  state: string
  salary: number
}

export default function Home() {
  const [people, setPeople] = useState<Person[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({ name: "", state: "", salary: 0 })

  const addPerson = () => {
    if (formData.name && formData.state) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: formData.name,
        state: formData.state,
        salary: formData.salary,
      }
      setPeople([...people, newPerson])
      setFormData({ name: "", state: "", salary: 0 })
    }
  }

  const filteredPeople = people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.state.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">SAARTHI</h1>
        <p className="text-muted-foreground">Soldiers Advisory & Resource Team For Handling Investments</p>
        <p className="text-sm text-muted-foreground">({people.length} total users)</p>
      </div>

      {/* Add Person Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Person</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Salary"
              value={formData.salary || ""}
              onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
            />
          </div>
          <Button onClick={addPerson} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* People Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.length > 0 ? (
          filteredPeople.map((person) => (
            <Card key={person.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{person.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{person.state}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p className="text-muted-foreground">Salary</p>
                  <p className="font-medium">₹{person.salary.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {searchTerm ? "No profiles found" : "No profiles added yet"}
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms" : "Add your first person to get started"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
